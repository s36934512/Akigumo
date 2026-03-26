-- 1. 先定義一個 Function
CREATE OR REPLACE FUNCTION outbox_notify()
RETURNS TRIGGER AS $$
BEGIN
    -- 發送通知到 'kernel_outbox_inserted' 頻道
    -- 內容是新資料的 ID (NEW.id)
    PERFORM pg_notify('kernel_outbox_inserted', NEW.id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 建立 Trigger 綁定到表上
CREATE TRIGGER trigger_outbox_insert
    AFTER INSERT ON "outbox"
    FOR EACH ROW
    EXECUTE PROCEDURE outbox_notify();
