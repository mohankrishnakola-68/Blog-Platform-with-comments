import express from 'express';
import { dbAll, dbGet, dbRun } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts (supports search, category, and author filter)
router.get('/', async (req, res) => {
  const { search, category, authorId } = req.query;

  let query = `
    SELECT posts.*, users.username as author_name, users.avatar_color as author_avatar_color 
    FROM posts 
    JOIN users ON posts.author_id = users.id
  `;
  const params = [];
  const conditions = [];

  if (category) {
    conditions.push('posts.category = ?');
    params.push(category);
  }

  if (authorId) {
    conditions.push('posts.author_id = ?');
    params.push(authorId);
  }

  if (search) {
    conditions.push('(posts.title LIKE ? OR posts.summary LIKE ? OR posts.content LIKE ?)');
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Sort by newest posts first
  query += ' ORDER BY posts.created_at DESC';

  try {
    const posts = await dbAll(query, params);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Server error fetching posts.' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a single post details along with author info and associated comments
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch Post details
    const post = await dbGet(`
      SELECT posts.*, users.username as author_name, users.avatar_color as author_avatar_color 
      FROM posts 
      JOIN users ON posts.author_id = users.id 
      WHERE posts.id = ?
    `, [id]);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // 2. Fetch associated comments
    const comments = await dbAll(`
      SELECT comments.*, users.username as author_name, users.avatar_color as author_avatar_color 
      FROM comments 
      JOIN users ON comments.author_id = users.id 
      WHERE comments.post_id = ? 
      ORDER BY comments.created_at DESC
    `, [id]);

    res.json({
      post,
      comments
    });
  } catch (error) {
    console.error('Error fetching post detail:', error);
    res.status(500).json({ error: 'Server error fetching post detail.' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
router.post('/', authMiddleware, async (req, res) => {
  const { title, summary, content, cover_image, category } = req.body;
  const author_id = req.user.id;

  // Validation
  if (!title || !summary || !content || !category) {
    return res.status(400).json({ error: 'Title, Summary, Content, and Category are required.' });
  }

  const fallbackImage = cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200';

  try {
    const result = await dbRun(`
      INSERT INTO posts (title, summary, content, cover_image, category, author_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, summary, content, fallbackImage, category, author_id]);

    res.status(201).json({
      message: 'Post created successfully.',
      id: result.id
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Server error creating post.' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update an existing post
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, summary, content, cover_image, category } = req.body;
  const userId = req.user.id;

  // Validation
  if (!title || !summary || !content || !category) {
    return res.status(400).json({ error: 'Title, Summary, Content, and Category are required.' });
  }

  try {
    // Check if post exists
    const post = await dbGet('SELECT author_id FROM posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Verify ownership
    if (post.author_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this post.' });
    }

    const updatedImage = cover_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200';

    await dbRun(`
      UPDATE posts 
      SET title = ?, summary = ?, content = ?, cover_image = ?, category = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [title, summary, content, updatedImage, category, id]);

    res.json({ message: 'Post updated successfully.' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Server error updating post.' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check if post exists
    const post = await dbGet('SELECT author_id FROM posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Verify ownership
    if (post.author_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this post.' });
    }

    await dbRun('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Server error deleting post.' });
  }
});

export default router;
