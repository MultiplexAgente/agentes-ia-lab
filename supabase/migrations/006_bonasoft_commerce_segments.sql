-- =====================================================================================
-- MIGRATION (DOCUMENTAL): 006_bonasoft_commerce_segments.sql
-- DESCRIÇÃO: Suporte a ERP Multissegmento BonaSoft Commerce (Farmácias, Mercados,
--            Moda, Gastronomia, Beleza, Pet Shop, Eletrônicos, Construção e Varejo Geral)
-- STATUS: NÃO EXECUTADA - ARQUIVO DOCUMENTAL PARA EVOLUÇÃO PLANEJADA DO BANCO
-- =====================================================================================

-- 1. ADIÇÃO DE SEGMENTO NA EMPRESA (TENANT)
ALTER TABLE IF EXISTS companies
    ADD COLUMN IF NOT EXISTS segment VARCHAR(50) DEFAULT 'food_service',
    ADD COLUMN IF NOT EXISTS trading_name VARCHAR(255), -- Nome fantasia
    ADD COLUMN IF NOT EXISTS state_registration VARCHAR(50), -- Inscrição Estadual
    ADD COLUMN IF NOT EXISTS municipal_registration VARCHAR(50); -- Inscrição Municipal

-- 2. SUPORTE A ATRIBUTOS VERTICAIS E CÓDIGO DE BARRAS NO CATÁLOGO DE PRODUTOS
ALTER TABLE IF EXISTS products
    ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
    ADD COLUMN IF NOT EXISTS barcode_ean VARCHAR(50),
    ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20) DEFAULT 'UN',
    ADD COLUMN IF NOT EXISTS current_stock NUMERIC(12, 3) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS min_stock NUMERIC(12, 3) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ncm VARCHAR(20), -- Nomenclatura Comum do Mercosul
    ADD COLUMN IF NOT EXISTS cest VARCHAR(20), -- Código Especificador da Substituição Tributária
    ADD COLUMN IF NOT EXISTS cfop VARCHAR(10),
    ADD COLUMN IF NOT EXISTS segment_attributes JSONB DEFAULT '{}'::jsonb;

-- ÍNDICES ADICIONAIS PARA ALTA PERFORMANCE NA BUSCA POR CÓDIGO DE BARRAS E SKU
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (company_id, barcode_ean);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (company_id, sku);
CREATE INDEX IF NOT EXISTS idx_companies_segment ON companies (segment);

-- 3. COMENTÁRIOS DE DOCUMENTAÇÃO DOS ATRIBUTOS POR SEGMENTO
COMMENT ON COLUMN products.segment_attributes IS 
'Atributos estruturados e validados pela camada Zod do BonaSoft Commerce:
- pharmacy: active_ingredient, anvisa_registration, is_controlled, prescription_type, dosage, manufacturer, is_generic, lot_number, expiration_date
- grocery: barcode_ean, unit_of_measure, allow_fractional_sale, tare_weight_kg, net_weight_kg, lot_number, expiration_date
- fashion: size, color, color_hex, gender, collection, fabric_composition, brand
- food_service: ingredients, preparation_time_minutes, serves_people, allows_custom_notes, allergens
- beauty: service_duration_minutes, professional_required, suggested_return_days, products_used
- pet_shop: target_species, pet_size, life_stage, package_weight_kg, requires_veterinary_prescription
- electronics: requires_serial_number, model_number, voltage, warranty_months, anatel_homologation
- construction: unit_of_sale, weight_kg_per_unit, coverage_yield_m2, heavy_freight, dimensions_cm
- general_retail: barcode_ean, brand, model, unit_of_measure, warranty_days';
