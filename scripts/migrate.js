const mysql = require('mysql2/promise');
require('dotenv').config();

const migrations = [
  {
    name: "add_super_admin_boolean_column",
    sql: `
      ALTER TABLE users 
      ADD COLUMN super_admin TINYINT(1) DEFAULT 0 NOT NULL 
      AFTER role;
    `
  },
  {
    name: "alter_document_requests_make_description_optional",
    sql: "ALTER TABLE document_requests MODIFY COLUMN description TEXT NULL;"
  },
  {
    name: "add_tax_and_hipo_document_types",
    sql: `
      ALTER TABLE documents 
      MODIFY COLUMN type enum('contract','poa','doc','tax','hipo') DEFAULT NULL;
    `
  },
  {
    name: "create_document_requests_table",
    sql: `
      CREATE TABLE IF NOT EXISTS document_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        message TEXT NULL,
        document_type VARCHAR(50) NULL,
        
        file_path VARCHAR(500) NULL,
        file_name VARCHAR(255) NULL,
        file_size INT UNSIGNED NULL,
        file_mime_type VARCHAR(100) NULL,
        has_attachment TINYINT(1) DEFAULT 0,
        
        status ENUM('pending', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        admin_message TEXT NULL,
        responded_by INT UNSIGNED NULL,
        responded_by_name VARCHAR(255) NULL,
        responded_at TIMESTAMP NULL,
        
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_document_type (document_type),
        INDEX idx_has_attachment (has_attachment),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `
  },
  {
    name: "create_notifications_table",
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        related_id INT UNSIGNED NULL,
        related_type VARCHAR(50) NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_type (type),
        INDEX idx_is_read (is_read),
        INDEX idx_related_id (related_id),
        INDEX idx_related_type (related_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `
  },
  {
    name: "create_admin_notifications_table",
    sql: `
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        related_id INT UNSIGNED NULL,
        related_type VARCHAR(50) NULL,
        data JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_related_id (related_id),
        INDEX idx_related_type (related_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `
  },
  {
    name: "create_admin_notification_reads_table",
    sql: `
      CREATE TABLE IF NOT EXISTS admin_notification_reads (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        notification_id INT UNSIGNED NOT NULL,
        admin_id INT UNSIGNED NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_admin_notification (notification_id, admin_id),
        INDEX idx_notification_id (notification_id),
        INDEX idx_admin_id (admin_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `
  },
  {
    name: "create_user_settings_table",
    sql: `
      CREATE TABLE IF NOT EXISTS user_settings (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        setting_key VARCHAR(100) NOT NULL,
        setting_value JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_setting (user_id, setting_key),
        INDEX idx_user_id (user_id),
        INDEX idx_setting_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `
  },
  {
    name: "add_foreign_keys",
    sql: `
      ALTER TABLE document_requests 
      ADD CONSTRAINT fk_document_requests_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
      
      ALTER TABLE document_requests 
      ADD CONSTRAINT fk_document_requests_responded_by 
      FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
      
      ALTER TABLE notifications 
      ADD CONSTRAINT fk_notifications_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
      
      ALTER TABLE admin_notification_reads 
      ADD CONSTRAINT fk_admin_notification_reads_notification_id 
      FOREIGN KEY (notification_id) REFERENCES admin_notifications(id) ON DELETE CASCADE ON UPDATE CASCADE;
      
      ALTER TABLE admin_notification_reads 
      ADD CONSTRAINT fk_admin_notification_reads_admin_id 
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
      
      ALTER TABLE user_settings 
      ADD CONSTRAINT fk_user_settings_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
    `
  },
];

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
  });

  try {
    console.log('Conectando ao banco de dados...');

    // Verificar estrutura da tabela users
    console.log('Verificando estrutura da tabela users...');
    const [userColumns] = await connection.query('DESCRIBE users');
    const idColumn = userColumns.find(col => col.Field === 'id');
    console.log('Coluna ID da tabela users:', idColumn);

    // Criar tabela de controle de migrations
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // Verificar migrations já executadas
    const [executedMigrations] = await connection.query('SELECT name FROM migrations');
    const executedNames = executedMigrations.map(m => m.name);

    // Executar migrations pendentes
    for (const migration of migrations) {
      if (!executedNames.includes(migration.name)) {
        console.log(`Executando: ${migration.name}`);
        
        try {
          // Se for a migration de foreign keys, executar comando por comando
          if (migration.name === "add_foreign_keys") {
            const commands = migration.sql.split(';').filter(cmd => cmd.trim());
            for (const command of commands) {
              if (command.trim()) {
                try {
                  await connection.execute(command);
                } catch (fkError) {
                  console.log(`⚠️  Aviso: ${fkError.message}`);
                }
              }
            }
          } else {
            await connection.execute(migration.sql);
          }
          
          await connection.execute(
            'INSERT INTO migrations (name) VALUES (?)',
            [migration.name]
          );
          console.log(`✅ ${migration.name} - OK`);
        } catch (migrationError) {
          console.error(`❌ Erro na migration ${migration.name}:`, migrationError.message);
          
          // Se der erro na foreign key, continuar sem ela
          if (migrationError.message.includes('foreign key') || migrationError.message.includes('incompatible')) {
            console.log(`⚠️  Pulando foreign keys - tabela criada sem constraints`);
            await connection.execute(
              'INSERT INTO migrations (name) VALUES (?)',
              [migration.name]
            );
          } else {
            throw migrationError;
          }
        }
      } else {
        console.log(`⏭️  ${migration.name} - Já executada`);
      }
    }

    console.log('🎉 Todas as migrations foram executadas!');
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await connection.end();
  }
}

runMigrations();