import React, { useState, useEffect } from 'react';
import { 
  SavedRecipe, 
  saveRecipeToFirestore, 
  getUserRecipesFromFirestore, 
  deleteRecipeFromFirestore 
} from '../services/recipeService';

interface FirestoreProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentProjectData: {
    pieceName: string;
    projectType: string;
    armholeType: string;
    necklineSelection: string;
    sizeCategory: string;
    mode: string;
    selectedSize: string;
    machineGauge?: string;
    barTypeSelection?: string;
    barSwatchValue?: string;
    barSwatchOrlaLength?: string;
    barSwatchGauge?: string;
    buttonBandTypeSelection?: string;
    buttonBandSwatchStitches?: string;
    buttonBandSwatchRows?: string;
    buttonBandSwatchGauge?: string;
    necklineArmholeFinishing?: string;
    finishingSwatchStitches?: string;
    finishingSwatchRows?: string;
    finishingSwatchGauge?: string;
    baseGradationSize?: string;
    formData: any;
    gradingValues: any;
  };
  onLoadProject: (project: SavedRecipe) => void;
}

export const FirestoreProjectsModal: React.FC<FirestoreProjectsModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentProjectData,
  onLoadProject
}) => {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveName, setSaveName] = useState<string>(currentProjectData.pieceName || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setSaveName(currentProjectData.pieceName || '');
      loadRecipes();
    }
  }, [isOpen, userId]);

  const loadRecipes = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await getUserRecipesFromFirestore(userId);
      setRecipes(data);
    } catch (e: any) {
      setFeedback({ type: 'error', message: 'Erro ao carregar projetos do banco de dados.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = saveName.trim() || `${currentProjectData.projectType} - ${new Date().toLocaleDateString('pt-BR')}`;
    setSaving(true);
    setFeedback(null);
    try {
      await saveRecipeToFirestore(userId, {
        name: finalName,
        projectType: currentProjectData.projectType,
        armholeType: currentProjectData.armholeType,
        necklineSelection: currentProjectData.necklineSelection,
        sizeCategory: currentProjectData.sizeCategory,
        mode: currentProjectData.mode,
        selectedSize: currentProjectData.selectedSize,
        machineGauge: currentProjectData.machineGauge,
        barTypeSelection: currentProjectData.barTypeSelection,
        barSwatchValue: currentProjectData.barSwatchValue,
        barSwatchOrlaLength: currentProjectData.barSwatchOrlaLength,
        barSwatchGauge: currentProjectData.barSwatchGauge,
        buttonBandTypeSelection: currentProjectData.buttonBandTypeSelection,
        buttonBandSwatchStitches: currentProjectData.buttonBandSwatchStitches,
        buttonBandSwatchRows: currentProjectData.buttonBandSwatchRows,
        buttonBandSwatchGauge: currentProjectData.buttonBandSwatchGauge,
        necklineArmholeFinishing: currentProjectData.necklineArmholeFinishing,
        finishingSwatchStitches: currentProjectData.finishingSwatchStitches,
        finishingSwatchRows: currentProjectData.finishingSwatchRows,
        finishingSwatchGauge: currentProjectData.finishingSwatchGauge,
        baseGradationSize: currentProjectData.baseGradationSize,
        formData: currentProjectData.formData,
        gradingValues: currentProjectData.gradingValues,
      });

      setFeedback({ type: 'success', message: `Projeto "${finalName}" salvo com sucesso no banco de dados!` });
      await loadRecipes();
    } catch (e: any) {
      setFeedback({ type: 'error', message: 'Erro ao salvar projeto no banco de dados.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteRecipeFromFirestore(userId, id);
      setDeleteConfirmId(null);
      setFeedback({ type: 'success', message: 'Projeto excluído do banco de dados.' });
      await loadRecipes();
    } catch (e: any) {
      setFeedback({ type: 'error', message: 'Erro ao excluir o projeto.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-6 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-emerald-950 font-black text-xl shadow-md">
              ☁️
            </div>
            <div>
              <h2 className="text-xl font-black font-display tracking-tight">Banco de Dados de Projetos</h2>
              <p className="text-xs text-emerald-200 font-medium">Salve e recupere suas tabelas de medidas e receitas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-emerald-300 hover:text-white text-2xl font-bold p-1 transition-colors"
            title="Fechar"
          >
            &times;
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-4 text-xs font-bold ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-red-50 text-red-800 border-b border-red-100'}`}>
            {feedback.message}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Seção: Salvar Projeto Atual */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>💾</span> Salvar Tabela Atual na Nuvem
            </h3>
            <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Ex: Suéter Raglan Adulto Lã 2/28"
                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 min-w-[140px]"
              >
                {saving ? 'Salvando...' : 'Salvar Projeto'}
              </button>
            </form>
          </div>

          {/* Seção: Meus Projetos Salvos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>📁</span> Projetos Salvos ({recipes.length})
              </h3>
              <button
                onClick={loadRecipes}
                disabled={loading}
                className="text-xs text-emerald-700 hover:underline font-bold"
              >
                {loading ? 'Atualizando...' : '↻ Atualizar Lista'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-700 border-t-transparent mb-2"></div>
                <p className="text-xs text-slate-500 font-semibold">Carregando projetos da nuvem...</p>
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
                <p className="text-sm font-bold text-slate-600 mb-1">Nenhum projeto salvo ainda</p>
                <p className="text-xs text-slate-400">Preencha suas medidas e clique no botão de salvar acima para guardar no banco de dados.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {recipes.map((rec) => (
                  <div 
                    key={rec.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{rec.name}</h4>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md px-2 py-0.5 font-bold">
                          {rec.projectType || 'Peça'} ({rec.armholeType || 'Raglan'})
                        </span>
                        <span className="bg-slate-100 text-slate-700 rounded-md px-2 py-0.5 font-semibold">
                          {rec.sizeCategory === 'child' ? 'Infantil' : rec.sizeCategory === 'teen' ? 'Juvenil' : 'Adulto'}
                        </span>
                        {rec.updatedAt && (
                          <span className="text-slate-400 self-center">
                            {new Date(rec.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          onLoadProject(rec);
                          onClose();
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-2xs"
                      >
                        Carregar
                      </button>

                      {deleteConfirmId === rec.id ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200">
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(rec.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-xs font-bold"
                          title="Excluir do banco de dados"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
