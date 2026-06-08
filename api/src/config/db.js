const { Pool } = require("pg");

const pool = new Pool(
    process.env.DB_URL ? {
        connectionString: process.env.DB_URL,
        ssl: { rejectUnauthorized: false }
    } : {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS
    }
);

const connectDatabase = async () => {
    try {
        // widget table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS widgets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                logo_url text,
                widget_bg text,
                widget_border text,
                title_color text,
                hover_title text,
                open_title text,
                status_color text,
                online_text text,
                offline_text text,
                arrow_color text,
                chat_bg text,
                date_color text,
                visitor_bg text,
                visitor_color text,
                visitor_shadow text,
                admin_bg text,
                admin_color text,
                admin_shadow text,
                time_color text,
                input_bg text,
                input_color text,
                send_bg text,
                send_color text,
                send_border text,
                send_shadow text
            );
        `);

        // admin table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
                name TEXT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                current_challenge TEXT,
                role TEXT DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'TEAM')),
                is_active BOOLEAN DEFAULT false,
                token_version INT DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // gmail token table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS gmail_tokens (
                id SERIAL PRIMARY KEY,
                admin_id UUID REFERENCES admins(id) ON DELETE CASCADE UNIQUE,
                email VARCHAR(255) NOT NULL,
                access_token TEXT,
                refresh_token TEXT,
                expiry_date BIGINT
            );
        `);

        // passkey authenticator table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS passkey_authenticators (
                id SERIAL PRIMARY KEY,
                admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
                credential_id TEXT UNIQUE NOT NULL,
                public_key TEXT NOT NULL,
                counter INTEGER DEFAULT 0,
                transports TEXT
            );   
        `);

        // passkey challenge table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS passkey_challenges (
                id SERIAL PRIMARY KEY,
                challenge TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );    
        `);

        // push_notification table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS push_notifications (
                id SERIAL PRIMARY KEY,
                widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
                admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
                endpoint TEXT NOT NULL,
                p256dh TEXT NOT NULL,
                auth TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                UNIQUE(admin_id, endpoint)
            );
        `);

        // slack_notification table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS slack_notifications (
                id SERIAL PRIMARY KEY,
                widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
                admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                channel TEXT,
                channel_id TEXT,
                is_active BOOLEAN DEFAULT true,
                UNIQUE(admin_id, widget_id)
            );
        `);

        // discord_notification table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS discord_notifications (
                id SERIAL PRIMARY KEY,
                widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
                admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                UNIQUE(admin_id, widget_id)
            );
        `);

        // telegram_notification table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS telegram_notifications (
                id SERIAL PRIMARY KEY,
                widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
                admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
                chat_id BIGINT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                UNIQUE(admin_id, widget_id)
            );
        `);

        // visitor table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visitors (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
                email VARCHAR(255),
                country CHAR(2) NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // chat table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chats (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
                visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // message table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id BIGSERIAL PRIMARY KEY,
                chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
                sender_type TEXT CHECK (sender_type IN ('VISITOR', 'ADMIN')),
                admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // create widget
        await pool.query(`
            CREATE OR REPLACE FUNCTION create_widget()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.widget_id IS NULL AND NOT EXISTS (SELECT 1 FROM admins WHERE email = NEW.email) THEN
                    INSERT INTO widgets DEFAULT VALUES 
                    RETURNING id INTO NEW.widget_id;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        await pool.query(`
            DROP TRIGGER IF EXISTS trigger_create_widget ON admins;
            CREATE TRIGGER trigger_create_widget
            BEFORE INSERT ON admins
            FOR EACH ROW
            EXECUTE FUNCTION create_widget();
        `);

        // delete widget
        await pool.query(`
            CREATE OR REPLACE FUNCTION delete_widget()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM admins WHERE widget_id = OLD.widget_id) THEN
                    DELETE FROM widgets WHERE id = OLD.widget_id;
                END IF;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;
        `);
        await pool.query(`
            DROP TRIGGER IF EXISTS trigger_delete_widget ON admins;
            CREATE TRIGGER trigger_delete_widget
            AFTER DELETE ON admins
            FOR EACH ROW
            EXECUTE FUNCTION delete_widget();
        `);

        console.log("Database connected");
    }
    catch (error) {
        throw new Error(`Database Error: ${error.message}`);
    }
};

module.exports = { pool, connectDatabase };