-- Align RiskLevel enum with existing domain monitoring writes.
-- Monitoring currently persists candidate risk levels as INFO/WARNING/CRITICAL.

ALTER TYPE "RiskLevel" ADD VALUE IF NOT EXISTS 'INFO';
ALTER TYPE "RiskLevel" ADD VALUE IF NOT EXISTS 'WARNING';
ALTER TYPE "RiskLevel" ADD VALUE IF NOT EXISTS 'CRITICAL';
