import express from 'express';
import { dbGet, dbRun } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// @route   POST /api/posts/:id/comments
// @desc    Add a comment to a post
router.post('/', authMiddleware, async (req, res) => {
  const { id: post_id } = req.params;
  const { content } = req.body;
  const author_id = req.user.id;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  try {
    const post = await dbGet('SELECT id FROM posts WHERE id = ?', [post_id]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const result = await dbRun(
      'INSERT INTO comments (content, post_id, author_id) VALUES (?, ?, ?)',
      [content.trim(), post_id, author_id]
    );

    // Return the new comment with author info
    const newComment = await dbGet(
      `SELECT comments.*, users.username as author_name, users.avatar_color as author_avatar_color
       FROM comments JOIN users ON comments.author_id = users.id
       WHERE comments.id = ?`,
      [result.id]
    );

    res.status(201).json({ message: 'Comment added.', comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Server error adding comment.' });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment (comment author only)
router.delete('/:commentId', authMiddleware, async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  try {
    const comment = await dbGet(
      'SELECT comments.*, posts.author_id as post_author_id FROM comments JOIN posts ON comments.post_id = posts.id WHERE comments.id = ?',
      [commentId]
    );

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Allow comment author OR post author to delete
    if (comment.author_id !== userId && comment.post_author_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment.' });
    }

    await dbRun('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Server error deleting comment.' });
  }
});

export default router;
