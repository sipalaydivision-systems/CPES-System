-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Editor', 'Viewer');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('Cash', 'InKind', 'Service', 'Scholarship', 'Infrastructure', 'Equipment', 'Supplies', 'Other');

-- CreateEnum
CREATE TYPE "TransmittalStatus" AS ENUM ('Submitted', 'Validated', 'Pending');

-- CreateEnum
CREATE TYPE "DonorCategory" AS ENUM ('Internal', 'External');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('Cash', 'InKind', 'Service', 'Equipment', 'Supplies', 'ConstructionMaterials', 'Food', 'Medals', 'Books', 'Other');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('Encoded', 'Validated', 'Utilized');

-- CreateEnum
CREATE TYPE "ResearchType" AS ENUM ('ActionResearch', 'InnovationPaper', 'CaseStudy', 'PolicyReview', 'Other');

-- CreateEnum
CREATE TYPE "ResearchStatus" AS ENUM ('Approved', 'Pending', 'Archived');

-- CreateEnum
CREATE TYPE "CertStatus" AS ENUM ('Pending', 'Issued', 'Approved');

-- CreateEnum
CREATE TYPE "AgreementType" AS ENUM ('MOA', 'MOU', 'DOD', 'DOA');

-- CreateEnum
CREATE TYPE "PartnerNature" AS ENUM ('LGU', 'NGO', 'PrivateCompany', 'Individual', 'AcademicInstitution', 'GovernmentAgency', 'Other');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('Active', 'Expired', 'Pending', 'Cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'Viewer',
    "school" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transmittal" (
    "id" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "cluster" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "contributionType" "ContributionType" NOT NULL,
    "numPartners" INTEGER NOT NULL,
    "amountContribution" DOUBLE PRECISION NOT NULL,
    "numBeneficiaries" INTEGER NOT NULL,
    "status" "TransmittalStatus" NOT NULL DEFAULT 'Submitted',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transmittal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "schoolId" TEXT,
    "schoolHead" TEXT,
    "coordinator" TEXT,
    "address" TEXT,
    "contact" TEXT,
    "quarter" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "donationType" "DonationType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "donorCategory" "DonorCategory" NOT NULL,
    "donorSubType" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3),
    "hasMOA" BOOLEAN NOT NULL DEFAULT false,
    "notarized" BOOLEAN NOT NULL DEFAULT false,
    "notarizedDate" TIMESTAMP(3),
    "usageDescription" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'Encoded',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Research" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ResearchType" NOT NULL,
    "author" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "abstract" TEXT,
    "status" "ResearchStatus" NOT NULL DEFAULT 'Approved',
    "fileId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Research_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "schoolHead" TEXT,
    "partnerName" TEXT NOT NULL,
    "amountReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "certDate" TIMESTAMP(3),
    "programYear" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "hiyas" BOOLEAN NOT NULL DEFAULT false,
    "status" "CertStatus" NOT NULL DEFAULT 'Pending',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "cluster" TEXT NOT NULL,
    "agreementType" "AgreementType" NOT NULL,
    "partnerName" TEXT NOT NULL,
    "partnerRep" TEXT,
    "partnerNature" "PartnerNature" NOT NULL,
    "purpose" TEXT NOT NULL,
    "effectivityStart" TIMESTAMP(3),
    "effectivityEnd" TIMESTAMP(3),
    "notarized" BOOLEAN NOT NULL DEFAULT false,
    "notarizedDate" TIMESTAMP(3),
    "status" "AgreementStatus" NOT NULL DEFAULT 'Active',
    "fileId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Transmittal_year_month_idx" ON "Transmittal"("year", "month");

-- CreateIndex
CREATE INDEX "Transmittal_school_idx" ON "Transmittal"("school");

-- CreateIndex
CREATE INDEX "Transmittal_cluster_idx" ON "Transmittal"("cluster");

-- CreateIndex
CREATE INDEX "Donation_year_quarter_idx" ON "Donation"("year", "quarter");

-- CreateIndex
CREATE INDEX "Donation_school_idx" ON "Donation"("school");

-- CreateIndex
CREATE INDEX "Donation_donorCategory_idx" ON "Donation"("donorCategory");

-- CreateIndex
CREATE INDEX "Research_year_idx" ON "Research"("year");

-- CreateIndex
CREATE INDEX "Research_type_idx" ON "Research"("type");

-- CreateIndex
CREATE INDEX "Certification_programYear_quarter_idx" ON "Certification"("programYear", "quarter");

-- CreateIndex
CREATE INDEX "Agreement_school_idx" ON "Agreement"("school");

-- CreateIndex
CREATE INDEX "Agreement_agreementType_idx" ON "Agreement"("agreementType");

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transmittal" ADD CONSTRAINT "Transmittal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Research" ADD CONSTRAINT "Research_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "UploadedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Research" ADD CONSTRAINT "Research_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "UploadedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
