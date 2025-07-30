const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/config');
const { logError, logInfo } = require('../utils/helpers');

class Database {
  constructor() {
    try {
      this.db = new sqlite3.Database(config.dbPath, (err) => {
        if (err) {
          logError(err, 'Database Connection');
          throw err;
        }
        logInfo('Connected to SQLite database', { dbPath: config.dbPath });
      });
      this.initializeTables();
    } catch (error) {
      logError(error, 'Database Constructor');
      throw error;
    }
  }

  async initializeTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo_url TEXT,
        status TEXT DEFAULT 'online',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        business_id TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender_type TEXT NOT NULL, -- 'business' or 'customer'
        sender_name TEXT NOT NULL,
        content TEXT,
        message_type TEXT DEFAULT 'text', -- 'text', 'file', 'image'
        file_url TEXT,
        file_name TEXT,
        status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      )`
    ];

    try {
      for (const query of queries) {
        await new Promise((resolve, reject) => {
          this.db.run(query, (err) => {
            if (err) {
              logError(err, 'Table Creation', { query: query.substring(0, 50) + '...' });
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
      
      logInfo('Database tables initialized successfully');
      await this.seedData();
    } catch (error) {
      logError(error, 'Initialize Tables');
      throw error;
    }
  }

  async seedData() {
    try {
      // Check if data already exists
      const existingBusiness = await this.getBusinessById('tech-store');
      if (existingBusiness) {
        logInfo('Database already seeded, skipping...');
        return;
      }

      // Insert demo business
      await new Promise((resolve, reject) => {
        this.db.run(`INSERT OR IGNORE INTO businesses (id, name, logo_url, status)
                     VALUES (?, ?, ?, ?)`,
                    ['tech-store', 'Tech Store Support', '/logo.png', 'online'],
                    function(err) {
                      if (err) {
                        logError(err, 'Seed Business Data');
                        reject(err);
                      } else {
                        resolve();
                      }
                    });
      });

      // Insert demo conversations
      const conversations = [
        ['John Doe', '+1234567890', 'tech-store', 'active'],
        ['Sarah Johnson', '+1234567891', 'tech-store', 'active'],
        ['Mike Chen', '+1234567892', 'tech-store', 'resolved']
      ];

      for (const conv of conversations) {
        await new Promise((resolve, reject) => {
          this.db.run(`INSERT OR IGNORE INTO conversations
                       (customer_name, customer_phone, business_id, status)
                       VALUES (?, ?, ?, ?)`, conv,
                       function(err) {
                         if (err) {
                           logError(err, 'Seed Conversation Data', { conversation: conv[0] });
                           reject(err);
                         } else {
                           resolve();
                         }
                       });
        });
      }

      logInfo('Database seeded successfully');
    } catch (error) {
      logError(error, 'Seed Data');
      throw error;
    }
  }

  // Database methods
  async getConversations(businessId) {
    return new Promise((resolve, reject) => {
      if (!businessId) {
        const error = new Error('Business ID is required');
        error.name = 'ValidationError';
        return reject(error);
      }

      this.db.all(`
        SELECT c.*,
               m.content as last_message,
               m.timestamp as last_message_time,
               COUNT(CASE WHEN m.status != 'read' AND m.sender_type = 'customer' THEN 1 END) as unread_count
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.business_id = ?
        GROUP BY c.id
        ORDER BY c.last_message_at DESC
      `, [businessId], (err, rows) => {
        if (err) {
          logError(err, 'Get Conversations', { businessId });
          err.name = 'DatabaseError';
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async getMessages(conversationId, limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM messages 
        WHERE conversation_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [conversationId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.reverse());
      });
    });
  }

  async createMessage(messageData) {
    return new Promise((resolve, reject) => {
      const { conversationId, senderType, senderName, content, messageType, fileUrl, fileName } = messageData;
      
      // Validate required fields
      if (!conversationId || !senderType || !senderName) {
        const error = new Error('Missing required fields: conversationId, senderType, senderName');
        error.name = 'ValidationError';
        return reject(error);
      }

      // Validate content or file
      if (!content && !fileUrl) {
        const error = new Error('Message must have either content or file attachment');
        error.name = 'ValidationError';
        return reject(error);
      }
      
      this.db.run(`
        INSERT INTO messages (conversation_id, sender_type, sender_name, content, message_type, file_url, file_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [conversationId, senderType, senderName, content, messageType || 'text', fileUrl, fileName],
       function(err) {
        if (err) {
          logError(err, 'Create Message', { conversationId, senderType });
          err.name = 'DatabaseError';
          reject(err);
        } else {
          const newMessage = { 
            id: this.lastID, 
            ...messageData, 
            timestamp: new Date().toISOString() 
          };
          resolve(newMessage);
        }
      });
    });
  }

  // Additional database methods for enhanced functionality
  async getBusinessById(businessId) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM businesses WHERE id = ?
      `, [businessId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async updateBusinessStatus(businessId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE businesses SET status = ? WHERE id = ?
      `, [status, businessId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  async getConversationById(conversationId) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM conversations WHERE id = ?
      `, [conversationId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async updateConversationStatus(conversationId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE conversations SET status = ? WHERE id = ?
      `, [status, conversationId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  async updateConversationTimestamp(conversationId) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [conversationId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  async getBusinessStats(businessId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          COUNT(DISTINCT c.id) as total_conversations,
          COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_conversations,
          COUNT(DISTINCT CASE WHEN c.status = 'resolved' THEN c.id END) as resolved_conversations,
          COUNT(m.id) as total_messages,
          COUNT(CASE WHEN m.sender_type = 'customer' THEN m.id END) as customer_messages,
          COUNT(CASE WHEN m.sender_type = 'business' THEN m.id END) as business_messages
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.business_id = ?
      `, [businessId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0] || {});
      });
    });
  }

  async searchConversations(businessId, searchTerm) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT c.*,
               m.content as last_message,
               m.timestamp as last_message_time,
               COUNT(CASE WHEN m.status != 'read' AND m.sender_type = 'customer' THEN 1 END) as unread_count
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.business_id = ? AND c.customer_name LIKE ?
        GROUP BY c.id
        ORDER BY c.last_message_at DESC
      `, [businessId, `%${searchTerm}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = new Database();