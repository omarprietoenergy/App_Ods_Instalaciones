-- Migration: 0000_pg_initial
-- Generated from drizzle/schema.ts (pg-core)
-- Creates all tables for the ODS Energy Installations app on PostgreSQL

-- Enums
CREATE TYPE "role" AS ENUM ('admin', 'project_manager', 'technician', 'admin_manager');
CREATE TYPE "workOrderType" AS ENUM ('installation', 'breakdown', 'maintenance');
CREATE TYPE "status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "documentType" AS ENUM ('plan', 'project', 'safety_plan', 'contract', 'permit', 'specification', 'conformity', 'other');
CREATE TYPE "materialType" AS ENUM ('received', 'requested');
CREATE TYPE "materialStatus" AS ENUM ('pending', 'requested', 'approved', 'ordered', 'received', 'incident', 'closed', 'rejected');
CREATE TYPE "category" AS ENUM ('fuel', 'toll', 'parking', 'hotel', 'meal', 'vehicle_cleaning', 'store_purchase', 'other');
CREATE TYPE "expenseStatus" AS ENUM ('pending', 'approved', 'rejected', 'pending_invoicing', 'invoiced', 'void');
CREATE TYPE "dailyAssignmentStatus" AS ENUM ('assigned', 'working', 'paused', 'completed');
CREATE TYPE "approvalStatus" AS ENUM ('approved', 'pending');
CREATE TYPE "assignmentSource" AS ENUM ('pm', 'system', 'technician');
CREATE TYPE "templateType" AS ENUM ('installation_started', 'installation_completed', 'client_conformity');
CREATE TYPE "shiftStatus" AS ENUM ('active', 'paused', 'ended');
CREATE TYPE "notificationType" AS ENUM ('assignment_pending', 'material_update', 'system');

-- Users
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) UNIQUE,
  "name" TEXT,
  "email" VARCHAR(320) NOT NULL UNIQUE,
  "password" TEXT,
  "loginMethod" VARCHAR(64),
  "role" "role" NOT NULL DEFAULT 'technician',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT now()
);

-- Installations
CREATE TABLE "installations" (
  "id" SERIAL PRIMARY KEY,
  "clientId" VARCHAR(255) NOT NULL,
  "clientName" VARCHAR(255) NOT NULL,
  "clientDocument" VARCHAR(50),
  "clientPhone" VARCHAR(50),
  "clientEmail" VARCHAR(320),
  "address" TEXT NOT NULL,
  "workOrderType" "workOrderType" NOT NULL DEFAULT 'installation',
  "workDescription" TEXT,
  "installationType" VARCHAR(100) NOT NULL DEFAULT 'solar',
  "installationPrice" DECIMAL(10,2),
  "laborPrice" DECIMAL(10,2),
  "budget" VARCHAR(50),
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "status" "status" NOT NULL DEFAULT 'pending',
  "assignedTechnicianIds" JSONB,
  "clientSignatureUrl" TEXT,
  "clientSignatureDate" TIMESTAMP,
  "technicianObservations" TEXT,
  "conformityPdfUrl" TEXT,
  "conformityPdfKey" VARCHAR(500),
  "createdById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE "documents" (
  "id" SERIAL PRIMARY KEY,
  "installationId" INTEGER NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "fileKey" VARCHAR(500) NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" VARCHAR(100),
  "documentType" "documentType" NOT NULL,
  "description" TEXT,
  "uploadedById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Daily Reports
CREATE TABLE "dailyReports" (
  "id" SERIAL PRIMARY KEY,
  "installationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "reportDate" TIMESTAMP NOT NULL,
  "workDescription" TEXT NOT NULL,
  "hoursWorked" INTEGER NOT NULL,
  "signatureUrl" TEXT,
  "signatureKey" VARCHAR(500),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Photos
CREATE TABLE "photos" (
  "id" SERIAL PRIMARY KEY,
  "dailyReportId" INTEGER NOT NULL,
  "fileKey" VARCHAR(500) NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "caption" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Materials
CREATE TABLE "materials" (
  "id" SERIAL PRIMARY KEY,
  "installationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "type" "materialType" NOT NULL,
  "requestId" VARCHAR(100),
  "materialName" VARCHAR(255) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "description" TEXT,
  "supplierName" VARCHAR(255),
  "deliveryNoteNumber" VARCHAR(100),
  "deliveryNotePhotoKey" VARCHAR(500),
  "deliveryNotePhotoUrl" TEXT,
  "status" "materialStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE "expenses" (
  "id" SERIAL PRIMARY KEY,
  "installationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "date" DATE NOT NULL,
  "category" "category" NOT NULL,
  "vendor" VARCHAR(255) NOT NULL,
  "documentNumber" VARCHAR(100) NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "receiptPhotoKey" VARCHAR(500) NOT NULL,
  "receiptPhotoUrl" TEXT NOT NULL,
  "status" "expenseStatus" NOT NULL DEFAULT 'pending_invoicing',
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Auxiliary Contacts
CREATE TABLE "auxiliaryContacts" (
  "id" SERIAL PRIMARY KEY,
  "installationId" INTEGER NOT NULL,
  "contactName" VARCHAR(255) NOT NULL,
  "contactPhone" VARCHAR(50),
  "contactRole" VARCHAR(100),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Installation Notes
CREATE TABLE "installationNotes" (
  "id" SERIAL PRIMARY KEY,
  "installationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "noteText" TEXT NOT NULL,
  "parentNoteId" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Installation Audit Logs
CREATE TABLE "installationAuditLogs" (
  "id" SERIAL PRIMARY KEY,
  "installationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Technician Daily Assignments
CREATE TABLE "technicianDailyAssignments" (
  "id" SERIAL PRIMARY KEY,
  "installationId" INTEGER NOT NULL,
  "technicianId" INTEGER NOT NULL,
  "date" DATE NOT NULL,
  "status" "dailyAssignmentStatus" NOT NULL DEFAULT 'assigned',
  "approvalStatus" "approvalStatus" NOT NULL DEFAULT 'approved',
  "assignmentSource" "assignmentSource" NOT NULL DEFAULT 'pm',
  "startTime" TIME,
  "endTime" TIME,
  "totalMinutes" INTEGER DEFAULT 0,
  "activeStartTime" TIMESTAMP,
  "totalHours" INTEGER DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "unique_assignment" ON "technicianDailyAssignments" ("technicianId", "installationId", "date");

-- Installation Status History
CREATE TABLE "installationStatusHistory" (
  "id" SERIAL PRIMARY KEY,
  "installationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "previousStatus" VARCHAR(50),
  "newStatus" VARCHAR(50) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Email Templates
CREATE TABLE "emailTemplates" (
  "id" SERIAL PRIMARY KEY,
  "templateType" "templateType" NOT NULL UNIQUE,
  "subject" VARCHAR(255) NOT NULL,
  "body" TEXT NOT NULL,
  "signature" TEXT,
  "logoUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Technician Shifts
CREATE TABLE "technicianShifts" (
  "id" SERIAL PRIMARY KEY,
  "technicianId" INTEGER NOT NULL,
  "date" DATE NOT NULL,
  "status" "shiftStatus" NOT NULL DEFAULT 'active',
  "startAt" TIMESTAMP NOT NULL DEFAULT now(),
  "endAt" TIMESTAMP,
  "totalMinutes" INTEGER DEFAULT 0,
  "activeStartAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "unique_shift" ON "technicianShifts" ("technicianId", "date");

-- Notifications
CREATE TABLE "notifications" (
  "id" SERIAL PRIMARY KEY,
  "type" "notificationType" NOT NULL,
  "installationId" INTEGER,
  "technicianId" INTEGER,
  "date" DATE,
  "message" TEXT NOT NULL,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
