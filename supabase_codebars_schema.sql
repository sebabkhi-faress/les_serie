-- ==============================================================================
-- SCHÉMA POSTGRESQL SUPABASE : TABLE "codebars" (SANS RLS - ACCÈS PUBLIC DIRECT)
-- À exécuter dans le "SQL Editor" de Supabase
-- RLS est explicitement DÉSACTIVÉ pour un accès direct et sans restriction.
-- ==============================================================================

-- 1. CRÉATION DE LA TABLE "codebars" DANS LE SCHÉMA PUBLIC
CREATE TABLE IF NOT EXISTS public.codebars (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    barcode VARCHAR(64) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL DEFAULT 'Destinataire Inconnu',
    document_title VARCHAR(255) NOT NULL DEFAULT 'DOCUMENT MÉDICAL',
    series_subtitle VARCHAR(255) DEFAULT '',
    barcode_svg TEXT,
    status VARCHAR(50) DEFAULT 'Actif',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Synonyme / Vue pour compatibilité avec le nom 'barcodes'
CREATE OR REPLACE VIEW public.barcodes AS
SELECT * FROM public.codebars;

-- 2. DÉSACTIVATION EXPLICITE DU ROW LEVEL SECURITY (RLS)
ALTER TABLE public.codebars DISABLE ROW LEVEL SECURITY;

-- 3. ATTRIBUTION DES PERMISSIONS TOTALES POUR LES CLÉS PUBLIQUES (ANON)
GRANT ALL ON TABLE public.codebars TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.barcodes TO anon, authenticated, service_role;

-- 4. INDEX POUR DES RECHERCHES INSTANTANÉES PAR CODE-BARRES ET ÉTUDIANT
CREATE INDEX IF NOT EXISTS idx_codebars_barcode ON public.codebars(barcode);
CREATE INDEX IF NOT EXISTS idx_codebars_created_at ON public.codebars(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_codebars_student_name ON public.codebars(student_name);

-- 5. TRIGGER AUTOMATIQUE POUR METTRE À JOUR 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_codebars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_codebars_updated_at ON public.codebars;
CREATE TRIGGER trigger_codebars_updated_at
BEFORE UPDATE ON public.codebars
FOR EACH ROW
EXECUTE FUNCTION public.handle_codebars_updated_at();

-- 6. MIGRATION DES ANCIENS CODES-BARRES DE L'ANCIEN FICHIER JSON
INSERT INTO public.codebars (id, barcode, student_name, document_title, series_subtitle, status, created_at)
VALUES
    ('PROT_1791410577101', '714415235521', 'beta', 'MODULE 02 : NOUVEAU MODULE', 'Exemplaire Nominatif Sécurisé', 'Actif', '2026-10-07 23:02:57+01'),
    ('PROT_1791369582142', '717392377602', 'SEBABKHI MOHAMED EL FATEH', 'UEI1 CARDIO-VASCULAIRE ,RESPERATOIRE ET PSYCHOLOGIE MEDICALE', 'Exemplaire Nominatif Sécurisé', 'Actif', '2026-10-07 11:39:42+01'),
    ('PROT_1791369506765', '711727625300', 'version beta', 'CARDIO', 'PDF Importé Sécurisé', 'Actif', '2026-10-07 11:38:26+01'),
    ('PROT_1791358774763', '715543437164', 'test', 'CARDIO', 'PDF Importé Sécurisé', 'Actif', '2026-10-07 08:39:34+01'),
    ('PROT_1791358614379', '718950666600', 'TEST', 'UEI1 CARDIO-VASCULAIRE ,RESPERATOIRE ET PSYCHOLOGIE MEDICALE', 'Exemplaire Nominatif Sécurisé', 'Actif', '2026-10-07 08:36:54+01')
ON CONFLICT (barcode) DO NOTHING;
