import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promise-based wrappers for SQLite operations
export const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize database schema
export const initDb = async () => {
  try {
    // Create Users Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Posts Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        cover_image TEXT,
        category TEXT NOT NULL,
        author_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Comments Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        post_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables verified/created successfully.');
    await seedData();
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
};

// Seed Mock Data if database is empty
const seedData = async () => {
  try {
    // Check if we already have users
    const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
    if (userCount.count > 0) {
      console.log('Database already has data. Skipping seeding.');
      return;
    }

    console.log('Seeding initial mock data...');

    // Hash passwords
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create seed users
    const users = [
      { username: 'john_developer', email: 'john@example.com', password_hash: passwordHash, avatar_color: '220, 90%, 65%' }, // Blue
      { username: 'creative_sarah', email: 'sarah@example.com', password_hash: passwordHash, avatar_color: '330, 85%, 65%' }, // Pink
      { username: 'tech_guru', email: 'guru@example.com', password_hash: passwordHash, avatar_color: '150, 75%, 45%' },     // Green
    ];

    const userIds = [];
    for (const u of users) {
      const result = await dbRun(
        'INSERT INTO users (username, email, password_hash, avatar_color) VALUES (?, ?, ?, ?)',
        [u.username, u.email, u.password_hash, u.avatar_color]
      );
      userIds.push(result.id);
    }

    // Create seed posts
    const posts = [
      {
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
        author_id: userIds[0]
      },
      {
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
        author_id: userIds[1]
      },
      {
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
        author_id: userIds[2]
      }
    ];

    const postIds = [];
    for (const p of posts) {
      const result = await dbRun(
        'INSERT INTO posts (title, summary, content, cover_image, category, author_id) VALUES (?, ?, ?, ?, ?, ?)',
        [p.title, p.summary, p.content, p.cover_image, p.category, p.author_id]
      );
      postIds.push(result.id);
    }

    // Create seed comments
    const comments = [
      { content: 'This is an outstanding writeup! The CSS Grid tip saved me hours of media queries.', post_id: postIds[0], author_id: userIds[1] },
      { content: 'Agreed, native CSS is extremely strong now. Beautifully styled site btw!', post_id: postIds[0], author_id: userIds[2] },
      { content: 'Glassmorphism looks incredible but be careful with performance on older mobile browsers.', post_id: postIds[1], author_id: userIds[0] },
      { content: 'Super helpful. Will use this to design my new personal portfolio dashboard.', post_id: postIds[1], author_id: userIds[2] }
    ];

    for (const c of comments) {
      await dbRun(
        'INSERT INTO comments (content, post_id, author_id) VALUES (?, ?, ?)',
        [c.content, c.post_id, c.author_id]
      );
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
};

export default db;
