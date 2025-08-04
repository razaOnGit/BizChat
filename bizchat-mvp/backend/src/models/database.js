const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    try {
      const dbPath = path.join(__dirname, '../../database.sqlite');
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err);
          throw err;
        }
        console.log('Connected to SQLite database');
      });
      this.initializeTables();
    } catch (error) {
      console.error('Database constructor error:', error);
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
        last_message TEXT,
        last_message_time TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id)
      )`,

      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender_type TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        content TEXT,
        message_type TEXT DEFAULT 'text',
        file_url TEXT,
        file_name TEXT,
        status TEXT DEFAULT 'sent',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      )`
    ];

    try {
      for (const query of queries) {
        await new Promise((resolve, reject) => {
          this.db.run(query, (err) => {
            if (err) {
              console.error('Table creation error:', err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }

      console.log('Database tables initialized successfully');
      await this.seedData();
    } catch (error) {
      console.error('Initialize tables error:', error);
      throw error;
    }
  }

  async seedData() {
    try {
      // Check if data already exists
      const existingBusiness = await this.getBusinessById('tech-store');
      if (existingBusiness) {
        console.log('Database already seeded, skipping...');
        return;
      }

      // Insert demo business
      await new Promise((resolve, reject) => {
        this.db.run(`INSERT INTO businesses (id, name, logo_url, status)
                     VALUES (?, ?, ?, ?)`,
          ['tech-store', 'Tech Store Support', '/logo.png', 'online'],
          function (err) {
            if (err) {
              console.error('Seed business error:', err);
              reject(err);
            } else {
              resolve();
            }
          });
      });

      // Insert demo conversations
      const conversations = [
        ['John Doe', '+1234567890', 'tech-store', 'active', 'Hi, my laptop is not charging properly', '2025-08-03 10:30:00'],
        ['Sarah Johnson', '+1234567891', 'tech-store', 'active', 'I need help with my order #12345', '2025-08-03 10:25:00'],
        ['Mike Chen', '+1234567892', 'tech-store', 'active', 'My gaming mouse stopped working', '2025-08-03 10:20:00'],
        ['Emma Wilson', '+1234567893', 'tech-store', 'resolved', 'Thank you for the help!', '2025-08-03 10:15:00'],
        ['David Smith', '+1234567894', 'tech-store', 'active', 'Keyboard keys are sticking', '2025-08-03 10:10:00']
      ];

      for (const conv of conversations) {
        await new Promise((resolve, reject) => {
          this.db.run(`INSERT INTO conversations
                       (customer_name, customer_phone, business_id, status, last_message, last_message_time)
                       VALUES (?, ?, ?, ?, ?, ?)`, conv,
            function (err) {
              if (err) {
                console.error('Seed conversation error:', err);
                reject(err);
              } else {
                resolve();
              }
            });
        });
      }

      console.log('Database seeded successfully');
    } catch (error) {
      console.error('Seed data error:', error);
      throw error;
    }
  }

  // Main database methods
  async getConversations(businessId) {
    return new Promise((resolve, reject) => {
      if (!businessId) {
        return reject(new Error('Business ID is required'));
      }

      this.db.all(`
        SELECT c.*,
               (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_type = 'customer') as unread_count
        FROM conversations c
        WHERE c.business_id = ?
        ORDER BY c.created_at DESC
      `, [businessId], (err, rows) => {
        if (err) {
          console.error('Get conversations error:', err);
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
      console.log('🔍 Database createMessage called with:', messageData);
      
      const { conversationId, senderType, senderName, senderId, content, messageType, fileUrl, fileName } = messageData;

      // Use senderName if provided, otherwise use senderId
      const actualSenderName = senderName || senderId;
      
      console.log('🔍 Processed fields:', {
        conversationId,
        senderType,
        actualSenderName,
        content,
        messageType: messageType || 'text',
        fileUrl,
        fileName
      });

      if (!conversationId || !senderType || !actualSenderName) {
        console.error('❌ Missing required fields:', { conversationId, senderType, senderName, senderId, actualSenderName });
        return reject(new Error('Missing required fields: conversationId, senderType, senderName/senderId'));
      }

      if (!content && !fileUrl) {
        console.error('❌ Missing content and fileUrl');
        return reject(new Error('Message must have either content or file attachment'));
      }

      const query = `
        INSERT INTO messages (conversation_id, sender_type, sender_name, content, message_type, file_url, file_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [conversationId, senderType, actualSenderName, content, messageType || 'text', fileUrl, fileName];
      
      console.log('🔍 Executing SQL:', query);
      console.log('🔍 With parameters:', params);

      this.db.run(query, params, function (err) {
        if (err) {
          console.error('❌ SQL execution error:', err);
          console.error('❌ Error details:', {
            message: err.message,
            code: err.code,
            errno: err.errno
          });
          reject(err);
        } else {
          console.log('✅ SQL executed successfully, lastID:', this.lastID);
          const newMessage = {
            id: this.lastID,
            conversation_id: conversationId,
            sender_type: senderType,
            sender_name: actualSenderName,
            content,
            message_type: messageType || 'text',
            file_url: fileUrl,
            file_name: fileName,
            timestamp: new Date().toISOString()
          };
          console.log('✅ Returning message:', newMessage);
          resolve(newMessage);
        }
      });
    });
  }

  // Helper methods
  async getBusinessById(businessId) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM businesses WHERE id = ?`, [businessId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getConversationById(conversationId) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM conversations WHERE id = ?`, [conversationId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async updateConversationTimestamp(conversationId) {
    return new Promise((resolve, reject) => {
      this.db.run(`UPDATE conversations SET last_message_time = CURRENT_TIMESTAMP WHERE id = ?`,
        [conversationId], function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
    });
  }

  async updateConversationLastMessage(conversationId, message, timestamp) {
    return new Promise((resolve, reject) => {
      this.db.run(`UPDATE conversations SET last_message = ?, last_message_time = ? WHERE id = ?`, 
        [message, timestamp, conversationId], function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
    });
  }

  async searchConversations(businessId, searchTerm) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT c.*,
               (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_type = 'customer') as unread_count
        FROM conversations c
        WHERE c.business_id = ? AND c.customer_name LIKE ?
        ORDER BY c.created_at DESC
      `, [businessId, `%${searchTerm}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = new Database();