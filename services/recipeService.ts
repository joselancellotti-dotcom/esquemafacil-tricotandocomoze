import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export interface SavedRecipe {
  id: string;
  userId: string;
  name: string;
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
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Salva ou atualiza uma receita/tabela no Firestore
 */
export async function saveRecipeToFirestore(userId: string, recipeData: Omit<SavedRecipe, 'id' | 'userId'>, existingId?: string): Promise<string> {
  const recipeId = existingId || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const recipeRef = doc(db, "users", userId, "recipes", recipeId);

  const payload: any = {
    ...recipeData,
    id: recipeId,
    userId: userId,
    updatedAt: new Date().toISOString(),
  };

  if (!existingId) {
    payload.createdAt = new Date().toISOString();
  }

  await setDoc(recipeRef, payload, { merge: true });
  return recipeId;
}

/**
 * Busca todas as receitas/tabelas salvas pelo usuário
 */
export async function getUserRecipesFromFirestore(userId: string): Promise<SavedRecipe[]> {
  try {
    const recipesRef = collection(db, "users", userId, "recipes");
    const q = query(recipesRef, orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    
    const recipes: SavedRecipe[] = [];
    snapshot.forEach(docSnap => {
      recipes.push(docSnap.data() as SavedRecipe);
    });
    return recipes;
  } catch (e) {
    // Fallback sem orderBy caso índice ainda esteja provisionando
    const recipesRef = collection(db, "users", userId, "recipes");
    const snapshot = await getDocs(recipesRef);
    const recipes: SavedRecipe[] = [];
    snapshot.forEach(docSnap => {
      recipes.push(docSnap.data() as SavedRecipe);
    });
    return recipes.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }
}

/**
 * Exclui uma receita/tabela do Firestore
 */
export async function deleteRecipeFromFirestore(userId: string, recipeId: string): Promise<void> {
  const recipeRef = doc(db, "users", userId, "recipes", recipeId);
  await deleteDoc(recipeRef);
}
