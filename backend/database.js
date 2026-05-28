import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.VERCEL
  ? '/tmp/database.json'
  : path.resolve(__dirname, 'database.json');

// Global Database State
let dbData = {
  users: [],
  posts: [],
  comments: []
};

// Synchronous Load
const loadData = () => {
  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      dbData = JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading database file, initializing empty:', err);
  }
};

// Synchronous Save
const saveData = () => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
};

// Promise-based wrappers mimicking SQLite
export const dbRun = (query, params = []) => {
  return new Promise((resolve) => {
    loadData();

    // 1. Insert User
    if (query.trim().startsWith('INSERT INTO users')) {
      const id = dbData.users.length + 1;
      const [username, email, password_hash, avatar_color] = params;
      const user = {
        id,
        username,
        email,
        password_hash,
        avatar_color,
        created_at: new Date().toISOString()
      };
      dbData.users.push(user);
      saveData();
      resolve({ id, changes: 1 });
      return;
    }

    // 2. Insert Post
    if (query.trim().startsWith('INSERT INTO posts')) {
      const id = dbData.posts.length + 1;
      const [title, summary, content, cover_image, category, author_id] = params;
      const post = {
        id,
        title,
        summary,
        content,
        cover_image,
        category,
        author_id: Number(author_id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      dbData.posts.push(post);
      saveData();
      resolve({ id, changes: 1 });
      return;
    }

    // 3. Update Post
    if (query.trim().startsWith('UPDATE posts')) {
      const [title, summary, content, cover_image, category, id] = params;
      const post = dbData.posts.find(p => p.id === Number(id));
      if (post) {
        post.title = title;
        post.summary = summary;
        post.content = content;
        post.cover_image = cover_image;
        post.category = category;
        post.updated_at = new Date().toISOString();
        saveData();
      }
      resolve({ changes: post ? 1 : 0 });
      return;
    }

    // 4. Delete Post
    if (query.trim().startsWith('DELETE FROM posts')) {
      const [id] = params;
      const initialLength = dbData.posts.length;
      dbData.posts = dbData.posts.filter(p => p.id !== Number(id));
      // Cascade delete comments
      dbData.comments = dbData.comments.filter(c => c.post_id !== Number(id));
      saveData();
      resolve({ changes: initialLength - dbData.posts.length });
      return;
    }

    // 5. Insert Comment
    if (query.trim().startsWith('INSERT INTO comments')) {
      const id = dbData.comments.length + 1;
      const [content, post_id, author_id] = params;
      const comment = {
        id,
        content,
        post_id: Number(post_id),
        author_id: Number(author_id),
        created_at: new Date().toISOString()
      };
      dbData.comments.push(comment);
      saveData();
      resolve({ id, changes: 1 });
      return;
    }

    // 6. Delete Comment
    if (query.trim().startsWith('DELETE FROM comments')) {
      const [id] = params;
      const initialLength = dbData.comments.length;
      dbData.comments = dbData.comments.filter(c => c.id !== Number(id));
      saveData();
      resolve({ changes: initialLength - dbData.comments.length });
      return;
    }

    // Default resolve
    resolve({ id: 0, changes: 0 });
  });
};

export const dbGet = (query, params = []) => {
  return new Promise((resolve) => {
    loadData();

    // 1. Get User Count (used by Seeder)
    if (query.includes('SELECT COUNT(*) as count FROM users')) {
      resolve({ count: dbData.users.length });
      return;
    }

    // 2. Select User by username check (registration check)
    if (query.includes('SELECT id FROM users WHERE username = ?')) {
      const [username] = params;
      const user = dbData.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      resolve(user ? { id: user.id } : null);
      return;
    }

    // 3. Select User by email check (registration check)
    if (query.includes('SELECT id FROM users WHERE email = ?')) {
      const [email] = params;
      const user = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      resolve(user ? { id: user.id } : null);
      return;
    }

    // 4. Select User by login credential (email or username)
    if (query.includes('SELECT * FROM users WHERE email = ? OR username = ?')) {
      const [emailOrUsername] = params;
      const user = dbData.users.find(u =>
        u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
        u.username.toLowerCase() === emailOrUsername.toLowerCase()
      );
      resolve(user || null);
      return;
    }

    // 5. Select User profile by id
    if (query.includes('FROM users WHERE id = ?')) {
      const [id] = params;
      const user = dbData.users.find(u => u.id === Number(id));
      resolve(user || null);
      return;
    }

    // 6. Select Post ownership check
    if (query.includes('SELECT author_id FROM posts WHERE id = ?')) {
      const [id] = params;
      const post = dbData.posts.find(p => p.id === Number(id));
      resolve(post ? { author_id: post.author_id } : null);
      return;
    }

    // 7. Get Single Post details (Join with author)
    if (query.includes('FROM posts') && query.includes('JOIN users') && query.includes('posts.id = ?')) {
      const [id] = params;
      const post = dbData.posts.find(p => p.id === Number(id));
      if (!post) {
        resolve(null);
        return;
      }
      const author = dbData.users.find(u => u.id === post.author_id) || {};
      resolve({
        ...post,
        author_name: author.username,
        author_avatar_color: author.avatar_color
      });
      return;
    }

    // Default resolve
    resolve(null);
  });
};

export const dbAll = (query, params = []) => {
  return new Promise((resolve) => {
    loadData();

    // 1. Get All Posts (Join with author + filters + sorting)
    if (query.includes('FROM posts') && query.includes('JOIN users')) {
      let result = dbData.posts.map(p => {
        const author = dbData.users.find(u => u.id === p.author_id) || {};
        return {
          ...p,
          author_name: author.username,
          author_avatar_color: author.avatar_color
        };
      });

      // Filter: Category
      if (query.includes('posts.category = ?')) {
        const catIdx = query.indexOf('posts.category = ?') > -1 ? params[0] : null;
        if (catIdx) {
          result = result.filter(r => r.category === catIdx);
        }
      }

      // Filter: Author
      if (query.includes('posts.author_id = ?')) {
        // Find index of authorId param
        const authorParamIdx = query.includes('posts.category = ?') ? 1 : 0;
        const authorId = params[authorParamIdx];
        if (authorId) {
          result = result.filter(r => r.author_id === Number(authorId));
        }
      }

      // Filter: Search Term
      if (query.includes('posts.title LIKE ?')) {
        // Search matches title, summary, or content
        const searchParam = params[params.length - 1]; // Search params are pushed at the end
        if (searchParam) {
          const term = searchParam.replace(/%/g, '').toLowerCase();
          result = result.filter(r =>
            r.title.toLowerCase().includes(term) ||
            r.summary.toLowerCase().includes(term) ||
            r.content.toLowerCase().includes(term)
          );
        }
      }

      // Order: created_at DESC
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      resolve(result);
      return;
    }

    // 2. Get Associated Comments (Join with author)
    if (query.includes('FROM comments') && query.includes('JOIN users')) {
      const [postId] = params;
      let result = dbData.comments
        .filter(c => c.post_id === Number(postId))
        .map(c => {
          const author = dbData.users.find(u => u.id === c.author_id) || {};
          return {
            ...c,
            author_name: author.username,
            author_avatar_color: author.avatar_color
          };
        });

      // Order: created_at DESC
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      resolve(result);
      return;
    }

    // Default resolve
    resolve([]);
  });
};

// Initialize database schema (Creates seed JSON if empty)
export const initDb = async () => {
  loadData();
  console.log('JSON Database loaded from:', dbPath);
  await seedData();
};

const seedData = async () => {
  try {
    if (dbData.users.length > 0) {
      console.log('Database already has data. Skipping seeding.');
      return;
    }

    console.log('Seeding initial mock data to JSON...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // Seed Users
    const users = [
      { id: 1, username: 'john_developer', email: 'john@example.com', password_hash: passwordHash, avatar_color: '220, 90%, 65%' },
      { id: 2, username: 'creative_sarah', email: 'sarah@example.com', password_hash: passwordHash, avatar_color: '330, 85%, 65%' },
      { id: 3, username: 'tech_guru', email: 'guru@example.com', password_hash: passwordHash, avatar_color: '150, 75%, 45%' },
    ];
    dbData.users = users;

    // Seed Posts
    const posts = [
      {
        id: 1,
        title: 'Mastering Custom Vanilla CSS in a Modern React Era',
        summary: 'Forget CSS-in-JS frameworks or massive utility libraries. Learn how to write high-performance, modular, and beautiful Vanilla CSS variables and grids.',
        content: `### Why Custom Vanilla CSS is Still King

In a web dominated by utility-first frameworks, it's easy to forget the power and flexibility of pure CSS. Modern CSS features like custom properties (variables), Grid, Flexbox, and native nesting give you all the tools you need to build stunning interfaces without shipping kilobytes of library bloat to your users.

Here is what we will cover in this article:
1. Setting up custom properties for theme design tokens.
2. Building a responsive layout with CSS Grid.
3. Adding animations and interactive micro-interactions.

\`\`\`css
/* Example Design Tokens */
:root {
  --primary-accent: hsl(260, 95%, 60%);
  --background-dark: hsl(220, 15%, 8%);
  --text-light: hsl(210, 15%, 95%);
}
\`\`\`

#### Responsive Layouts Without Queries

One of CSS Grid's best features is \`grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))\`. This allows your layouts to automatically adapt to screen sizes without a single media query.

Let's embrace the simplicity and power of native technologies!`,
        cover_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=1200',
        category: 'Development',
        author_id: 1,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 2,
        title: 'The Art of Glassmorphism: Designing for Depth',
        summary: 'Explore how to create beautiful glass-like panels using backdrop-filters, subtle borders, and gradients to wow your audience.',
        content: `### Creating Visual Layering on the Web

Glassmorphism has taken the design world by storm. It uses a combination of transparency, blur, and borders to create depth and visual hierarchy. When combined with dark mode and vibrant background elements, it makes interfaces look incredibly premium.

#### The Three Golden Rules of Glassmorphism:

1. **Keep the opacity low:** The background color opacity should sit between 5% and 15%.
2. **Apply backdrop-filter blur:** A blur of \`10px\` to \`20px\` is usually the sweet spot.
3. **Add a thin, semi-transparent border:** A 1px border with low-opacity white creates a beautiful "glowing edge" that sets it apart.

\`\`\`css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
\`\`\`

Try incorporating this aesthetic into your next dashboard or dashboard cards for instant visual satisfaction!`,
        cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
        category: 'Design',
        author_id: 2,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 3,
        title: 'Building Lightweight API Gateways with Node.js',
        summary: 'A step-by-step guide to assembling your own routing proxy and load balancer in less than 200 lines of standard Javascript.',
        content: `### Scaling Node.js Microservices

When building scalable microservice architectures, API gateways are crucial. They serve as a single entry point, handle routing, security, rate limiting, and analytics.

While tools like Kong or NGINX exist, sometimes a custom gateway built directly in Express or raw Node.js is the most flexible choice.

#### Core components of a simple API Gateway:
- **Router middleware:** Dynamically proxies requests to microservices.
- **Auth interceptor:** Validates tokens before hitting backend services.
- **Caching engine:** Stores frequent responses in memory or Redis.

Let's build a quick example of a proxy router using \`http-proxy-middleware\` in Node.js...`,
        cover_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200',
        category: 'Tech',
        author_id: 3,
        created_at: new Date(Date.now() - 600000 * 15).toISOString(), // 15 mins ago
        updated_at: new Date(Date.now() - 600000 * 15).toISOString()
      }
    ];
    dbData.posts = posts;

    // Seed Comments
    const comments = [
      { id: 1, content: 'This is an outstanding writeup! The CSS Grid tip saved me hours of media queries.', post_id: 1, author_id: 2, created_at: new Date(Date.now() - 3600000 * 18).toISOString() },
      { id: 2, content: 'Agreed, native CSS is extremely strong now. Beautifully styled site btw!', post_id: 1, author_id: 3, created_at: new Date(Date.now() - 3600000 * 16).toISOString() },
      { id: 3, content: 'Glassmorphism looks incredible but be careful with performance on older mobile browsers.', post_id: 2, author_id: 1, created_at: new Date(Date.now() - 3600000 * 4).toISOString() },
      { id: 4, content: 'Super helpful. Will use this to design my new personal portfolio dashboard.', post_id: 2, author_id: 3, created_at: new Date(Date.now() - 3600000 * 2).toISOString() }
    ];
    dbData.comments = comments;

    saveData();
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
};

export default dbData;
