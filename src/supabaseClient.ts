import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Erro: Variáveis do Supabase não encontradas. Verifique se o arquivo .env está na raiz do projeto!",
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
