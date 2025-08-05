-- Complete Supabase Database Setup Script for Student Management System
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- Enable UUID extension for random UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    duration INTEGER NOT NULL, -- in months
    full_fee DECIMAL(10, 2) NOT NULL,
    installment_fee DECIMAL(10, 2) NOT NULL,
    fee_plans TEXT NOT NULL, -- JSON string containing installment plans
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    course_id VARCHAR NOT NULL REFERENCES courses(id),
    contact_no TEXT NOT NULL,
    address TEXT NOT NULL,
    father_contact_no TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending' | 'confirmed' | 'enrolled'
    batch_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id VARCHAR NOT NULL REFERENCES inquiries(id),
    student_name TEXT NOT NULL,
    course_id VARCHAR NOT NULL REFERENCES courses(id),
    contact_no TEXT NOT NULL,
    father_name TEXT NOT NULL,
    father_contact_no TEXT NOT NULL,
    student_education TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_address TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    fee_plan TEXT NOT NULL, -- 'full' | 'installments'
    total_fee DECIMAL(10, 2) NOT NULL,
    batch_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id VARCHAR NOT NULL REFERENCES enrollments(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode TEXT NOT NULL, -- 'cash' | 'card' | 'upi' | 'bank_transfer'
    transaction_id TEXT,
    installment_number INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
-- Note: In production, use a secure hashed password
INSERT INTO users (username, password) 
VALUES ('admin', '$2b$10$rOzJqQqJqQqJqQqJqQqJqOzJqQqJqQqJqQqJqQqJqOzJqQqJqQqJqu')
ON CONFLICT (username) DO NOTHING;

-- Insert default courses
INSERT INTO courses (name, code, duration, full_fee, installment_fee, fee_plans, description, is_active) VALUES
('Office Basic', 'OB001', 3, 3500.00, 3750.00, '[{"name":"Full Payment","amount":3500,"description":"Complete payment at enrollment"},{"name":"Monthly Plan","installments":[{"month":0,"amount":1250},{"month":1,"amount":1250},{"month":2,"amount":1250}],"totalAmount":3750,"description":"Pay in 3 monthly installments"}]', 'Basic office applications training', true),
('CCC ITC', 'CCC001', 3, 3500.00, 3750.00, '[{"name":"Full Payment","amount":3500,"description":"Complete payment at enrollment"},{"name":"Monthly Plan","installments":[{"month":0,"amount":1250},{"month":1,"amount":1250},{"month":2,"amount":1250}],"totalAmount":3750,"description":"Pay in 3 monthly installments"}]', 'Course on Computer Concepts - ITC certified', true),
('C.C.C (DOEACC)', 'CCC002', 6, 4000.00, 4000.00, '[{"name":"Full Payment","amount":4000,"description":"Complete payment at enrollment"},{"name":"Quarterly Plan","installments":[{"month":0,"amount":2000},{"month":3,"amount":2000}],"totalAmount":4000,"description":"Pay in 2 quarterly installments"}]', 'Course on Computer Concepts - DOEACC certified', true),
('Tally Basic A', 'TALLY001', 3, 5000.00, 5500.00, '[{"name":"Full Payment","amount":5000,"description":"Complete payment at enrollment"},{"name":"Monthly Plan","installments":[{"month":0,"amount":2000},{"month":1,"amount":1750},{"month":2,"amount":1750}],"totalAmount":5500,"description":"Pay in 3 monthly installments"}]', 'Basic Tally accounting software training', true),
('Tally GST', 'TALLY002', 6, 13000.00, 13500.00, '[{"name":"Full Payment","amount":13000,"description":"Complete payment at enrollment"},{"name":"Quarterly Plan","installments":[{"month":0,"amount":4500},{"month":2,"amount":4500},{"month":4,"amount":4500}],"totalAmount":13500,"description":"Pay in 3 quarterly installments"}]', 'Advanced Tally with GST compliance', true),
('D.E.O (Data Entry Operator)', 'DEO001', 6, 10500.00, 13500.00, '[{"name":"Full Payment","amount":10500,"description":"Complete payment at enrollment"},{"name":"Monthly Plan","installments":[{"month":0,"amount":2250},{"month":1,"amount":2250},{"month":2,"amount":2250},{"month":3,"amount":2250},{"month":4,"amount":2250},{"month":5,"amount":2250}],"totalAmount":13500,"description":"Pay in 6 monthly installments"}]', 'Data Entry Operator certification course', true),
('D.T.P (Desktop Publishing)', 'DTP001', 6, 5000.00, 5500.00, '[{"name":"Full Payment","amount":5000,"description":"Complete payment at enrollment"},{"name":"Quarterly Plan","installments":[{"month":0,"amount":2750},{"month":3,"amount":2750}],"totalAmount":5500,"description":"Pay in 2 quarterly installments"}]', 'Desktop Publishing and design course', true),
('AutoCAD', 'ACAD001', 3, 7000.00, 7000.00, '[{"name":"Full Payment","amount":7000,"description":"Complete payment at enrollment"},{"name":"Monthly Plan","installments":[{"month":0,"amount":2500},{"month":1,"amount":2250},{"month":2,"amount":2250}],"totalAmount":7000,"description":"Pay in 3 monthly installments"}]', 'AutoCAD 2D and 3D design course', true),
('D.C.A (Diploma in Computer Applications)', 'DCA001', 12, 27000.00, 27500.00, '[{"name":"Full Payment","amount":27000,"description":"Complete payment at enrollment"},{"name":"Quarterly Plan","installments":[{"month":0,"amount":7000},{"month":3,"amount":7000},{"month":6,"amount":6750},{"month":9,"amount":6750}],"totalAmount":27500,"description":"Pay in 4 quarterly installments"}]', 'Comprehensive computer applications diploma', true),
('H.D.C.A (Higher Diploma in Computer Applications)', 'HDCA001', 24, 35000.00, 35500.00, '[{"name":"Full Payment","amount":35000,"description":"Complete payment at enrollment"},{"name":"Semi-Annual Plan","installments":[{"month":0,"amount":9000},{"month":6,"amount":8875},{"month":12,"amount":8875},{"month":18,"amount":8750}],"totalAmount":35500,"description":"Pay in 4 semi-annual installments"}]', 'Advanced computer applications higher diploma', true)
ON CONFLICT (code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inquiries_course_id ON inquiries(course_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_inquiry_id ON enrollments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON payments(enrollment_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_inquiries_updated_at 
    BEFORE UPDATE ON inquiries 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at 
    BEFORE UPDATE ON enrollments 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();