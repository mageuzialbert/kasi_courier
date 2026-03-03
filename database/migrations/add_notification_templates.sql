-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL, -- e.g., 'client_order_created'
  title TEXT NOT NULL,       -- e.g., 'New Order Created (Client)'
  actor_type TEXT NOT NULL CHECK (actor_type IN ('CLIENT', 'RIDER', 'ADMIN')),
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of strings e.g., '["{{client_name}}", "{{order_number}}"]'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (or restrict to STAFF/ADMIN if needed)
CREATE POLICY "Allow read access to authenticated users" 
ON notification_templates FOR SELECT 
TO authenticated 
USING (true);

-- Allow ADMIN/STAFF to insert/update/delete
CREATE POLICY "Allow ALL for ADMIN and STAFF" 
ON notification_templates FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'ADMIN' OR users.role = 'STAFF')
  )
);

-- Insert default templates
INSERT INTO notification_templates (name, title, actor_type, content, variables) VALUES
-- Client Notifications
(
  'client_new_order_created', 
  'New Order Created', 
  'CLIENT', 
  'Dear {{client_name}}, your order has been received and is being processed.', 
  '["{{client_name}}", "{{business_name}}", "{{pickup_address}}", "{{dropoff_address}}"]'
),
(
  'client_order_delivered', 
  'Order Delivered', 
  'CLIENT', 
  'Dear {{client_name}}, your order has been successfully delivered. Thank you for choosing Kasi Courier.', 
  '["{{client_name}}", "{{business_name}}"]'
),

-- Rider Notifications
(
  'rider_new_ride_assignment', 
  'New Ride Assignment', 
  'RIDER', 
  'Hello {{rider_name}}, you have a new delivery assignment from {{pickup_address}} to {{dropoff_address}}.', 
  '["{{rider_name}}", "{{pickup_address}}", "{{dropoff_address}}", "{{business_name}}"]'
),

-- Admin Notifications
(
  'admin_rider_created_ride', 
  'Rider Created Ride to Confirm', 
  'ADMIN', 
  'Admin alert: Rider {{rider_name}} has created a new ride that requires confirmation.', 
  '["{{rider_name}}", "{{pickup_address}}", "{{dropoff_address}}"]'
),
(
  'admin_new_business_registered', 
  'New Business Registered', 
  'ADMIN', 
  'Admin alert: A new business "{{business_name}}" has been registered.', 
  '["{{business_name}}", "{{contact_phone}}"]'
),
(
  'admin_new_delivery_order', 
  'New Delivery Order (Assign Rider)', 
  'ADMIN', 
  'Admin alert: {{business_name}} created a new delivery order. Please assign a rider.', 
  '["{{business_name}}", "{{pickup_address}}", "{{dropoff_address}}"]'
)
ON CONFLICT (name) DO NOTHING;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_templates_modtime
BEFORE UPDATE ON notification_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
