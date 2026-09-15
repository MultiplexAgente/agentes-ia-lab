import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store, supabase } from '../config/database.js';
import { aiBuilderService } from '../services/builder/AIBuilderService.js';
import { DataQueryEngine } from '../services/builder/DataQueryEngine.js';
import { AIBuilderModule, AIBuilderModuleVersion } from '../types/index.js';

export const builderRouter = Router();

const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

// 1. LISTAR TODOS OS MÓDULOS CRIADOS
builderRouter.get('/modules', async (req: Request, res: Response) => {
  const companyId = (req.query.company_id as string) || DEFAULT_COMPANY_ID;

  // Busca do InMemoryStore
  const localModules = Array.from(store.builderModules.values())
    .filter(m => m.company_id === companyId && m.status === 'active')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Se o Supabase estiver ativo, sincroniza
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_builder_modules')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        data.forEach((m: any) => store.builderModules.set(m.id, m));
        return res.json({ modules: data });
      }
    } catch (e) {
      console.warn('Erro ao consultar Supabase para módulos, usando memória:', e);
    }
  }

  return res.json({ modules: localModules });
});

// 2. DETALHES DE UM MÓDULO
builderRouter.get('/modules/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const mod = store.builderModules.get(id);

  if (!mod) {
    return res.status(404).json({ error: 'Módulo não encontrado.' });
  }

  return res.json({ module: mod });
});

// 3. GERAR AI BUILD PLAN COM PREVIEW A PARTIR DE LINGUAGEM NATURAL
builderRouter.post('/plan', async (req: Request, res: Response) => {
  const { prompt, currentModuleId, companyId = DEFAULT_COMPANY_ID } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'O prompt descritivo é obrigatório.' });
  }

  try {
    const plan = await aiBuilderService.generateBuildPlan({
      companyId,
      prompt: prompt.trim(),
      currentModuleId
    });

    return res.json({ plan });
  } catch (err: any) {
    console.error('Erro ao gerar plano do AI Builder:', err);
    return res.status(500).json({ error: 'Falha ao processar solicitação de construção com IA.' });
  }
});

// 4. CONFIRMAR E CRIAR NOVO MÓDULO
builderRouter.post('/modules', async (req: Request, res: Response) => {
  const { 
    name, slug, description, icon = 'Layout', schema, prompt, build_plan,
    companyId = DEFAULT_COMPANY_ID 
  } = req.body;

  if (!name || !schema) {
    return res.status(400).json({ error: 'Nome e schema do módulo são obrigatórios.' });
  }

  const moduleId = uuidv4();
  const generatedSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

  const newModule: AIBuilderModule = {
    id: moduleId,
    company_id: companyId,
    name,
    slug: generatedSlug,
    description: description || 'Módulo gerado por inteligência artificial.',
    icon,
    status: 'active',
    schema,
    version: 1,
    created_by: 'Anthony Both',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Salva no InMemoryStore
  store.builderModules.set(moduleId, newModule);

  const initialVersion: AIBuilderModuleVersion = {
    id: uuidv4(),
    module_id: moduleId,
    version: 1,
    schema,
    prompt: prompt || 'Criação inicial do módulo',
    build_plan,
    created_by: 'Anthony Both',
    created_at: new Date().toISOString()
  };
  store.builderModuleVersions.set(moduleId, [initialVersion]);

  // Auditoria
  store.builderActions.push({
    id: uuidv4(),
    company_id: companyId,
    module_id: moduleId,
    action: 'create_module',
    prompt,
    build_plan,
    created_at: new Date().toISOString()
  });

  // Tenta persistir no Supabase se ativo
  if (supabase) {
    try {
      await supabase.from('ai_builder_modules').insert([newModule]);
      await supabase.from('ai_builder_module_versions').insert([initialVersion]);
    } catch (e) {
      console.warn('Supabase insert module fallback:', e);
    }
  }

  return res.status(201).json({ module: newModule });
});

// 5. ATUALIZAR MÓDULO VIA PATCH / EDIÇÃO COM IA (NOVA VERSÃO)
builderRouter.put('/modules/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { schema, prompt, build_plan } = req.body;

  const currentMod = store.builderModules.get(id);
  if (!currentMod) {
    return res.status(404).json({ error: 'Módulo não encontrado para atualização.' });
  }

  const nextVersion = currentMod.version + 1;
  const updatedModule: AIBuilderModule = {
    ...currentMod,
    schema: schema || currentMod.schema,
    version: nextVersion,
    updated_at: new Date().toISOString()
  };

  store.builderModules.set(id, updatedModule);

  // Registra nova versão no histórico
  const newVersionEntry: AIBuilderModuleVersion = {
    id: uuidv4(),
    module_id: id,
    version: nextVersion,
    schema: updatedModule.schema,
    prompt: prompt || `Atualização versão ${nextVersion}`,
    build_plan,
    created_by: 'Anthony Both',
    created_at: new Date().toISOString()
  };

  const currentVersions = store.builderModuleVersions.get(id) || [];
  store.builderModuleVersions.set(id, [newVersionEntry, ...currentVersions]);

  // Auditoria
  store.builderActions.push({
    id: uuidv4(),
    company_id: currentMod.company_id,
    module_id: id,
    action: 'patch_module',
    prompt,
    build_plan,
    created_at: new Date().toISOString()
  });

  // Supabase update
  if (supabase) {
    try {
      await supabase.from('ai_builder_modules').update({
        schema: updatedModule.schema,
        version: nextVersion,
        updated_at: updatedModule.updated_at
      }).eq('id', id);

      await supabase.from('ai_builder_module_versions').insert([newVersionEntry]);
    } catch (e) {
      console.warn('Supabase update fallback:', e);
    }
  }

  return res.json({ module: updatedModule });
});

// 6. EXCLUIR MÓDULO (Sem apagar dados de negócio da empresa)
builderRouter.delete('/modules/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const currentMod = store.builderModules.get(id);

  if (!currentMod) {
    return res.status(404).json({ error: 'Módulo não encontrado.' });
  }

  // Soft delete / remoção da interface
  store.builderModules.delete(id);

  if (supabase) {
    try {
      await supabase.from('ai_builder_modules').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete fallback:', e);
    }
  }

  return res.json({ success: true, message: `Módulo "${currentMod.name}" removido do painel com sucesso.` });
});

// 7. HISTÓRICO DE VERSÕES
builderRouter.get('/modules/:id/versions', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const versions = store.builderModuleVersions.get(id) || [];
  return res.json({ versions });
});

// 8. RESTAURAR VERSÃO ANTERIOR (ROLLBACK)
builderRouter.post('/modules/:id/rollback', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { targetVersion } = req.body;

  const currentMod = store.builderModules.get(id);
  if (!currentMod) {
    return res.status(404).json({ error: 'Módulo não encontrado.' });
  }

  const versions = store.builderModuleVersions.get(id) || [];
  const versionToRestore = versions.find(v => v.version === Number(targetVersion));

  if (!versionToRestore) {
    return res.status(404).json({ error: `Versão ${targetVersion} não encontrada.` });
  }

  const nextVersion = currentMod.version + 1;
  const rolledBackModule: AIBuilderModule = {
    ...currentMod,
    schema: versionToRestore.schema,
    version: nextVersion,
    updated_at: new Date().toISOString()
  };

  store.builderModules.set(id, rolledBackModule);

  const rollbackVersionEntry: AIBuilderModuleVersion = {
    id: uuidv4(),
    module_id: id,
    version: nextVersion,
    schema: versionToRestore.schema,
    prompt: `Restauração para a versão v${targetVersion}`,
    created_by: 'Anthony Both',
    created_at: new Date().toISOString()
  };

  store.builderModuleVersions.set(id, [rollbackVersionEntry, ...versions]);

  return res.json({ module: rolledBackModule });
});

// 9. DATA QUERY ENGINE: POPULA DADOS REAIS DOS COMPONENTES
builderRouter.post('/query', async (req: Request, res: Response) => {
  let { components, schema, period = 'month', search = '', companyId = DEFAULT_COMPANY_ID } = req.body;

  if (!Array.isArray(components) && schema?.sections) {
    components = schema.sections.flatMap((s: any) => s.components || []);
  }

  if (!Array.isArray(components)) {
    return res.status(400).json({ error: 'Lista de componentes ou schema é obrigatório para a consulta.' });
  }

  try {
    const data = await DataQueryEngine.executeModuleQueries({
      companyId,
      components,
      period,
      search
    });

    return res.json({ data });
  } catch (err: any) {
    console.error('Erro na execução de query do DataQueryEngine:', err);
    return res.status(500).json({ error: 'Erro ao calcular métricas de componentes.' });
  }
});
