import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabaseClient";

// Ordem: Dinamite, Denise, Felix
const COLABORADORES = ["Dinamite", "Denise", "Felix"];

const FERIADOS_2026 = [
  "01/01", "16/02", "17/02", "03/04", "21/04", "01/05", "04/06",
  "07/09", "12/10", "02/11", "15/11", "20/11", "25/12",
];

const LISTA_GIFS = [
  { url: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTZqczVmNnhvOGZ1amVvanFxaHp1bDlienFiNDNsOTBtNnVxMnVxcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TR996IaHtmDi1x98zW/giphy.gif", texto: "Tirou os Lixos do Estoque ou meteu o louco?" },
  { url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3hpN3Q0cWtldjI1MHV2dndiYzRjMmN3aGgzMWIzNGpodzB0aXBnNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LR5GeZFCwDRcpG20PR/giphy.gif", texto: "Boa familia! Bom descanso!" },
  { url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2FhZnZvZDZrOXlqeHEydm5zM2FnNHY1MDV3MHZzNnV3dmk0bWE1cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yoJC2GnSClbPOkV0eA/giphy.gif", texto: "Sextooooou vamos embora!" },
  { url: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTZ1NTNvYTVhN2V2OXAxa2Q4N3FvdXp4MDVqNm16amhzaXF1YTl5MyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/gVsmn4qdyBn1Bra2tN/giphy.gif", texto: "Sextooou, boa folgaaaaa!" },
  { url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHdsaTBjZDg3bW1mZHNtZW1vZWYyemk5cHY5MjJ3MmV1MWUxbDJvOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/13CoXDiaCcCoyk/giphy.gif", texto: "Sextooou, boa folgaaaaa!" },
  { url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHc2dzJrZ3M0NTMyeHg4aXM5ajVvbGxobXhra3o3bDlocXRkZW9iMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QxcSqRe0nllClKLMDn/giphy.gif", texto: "Não esqueceu de varrer o estoque né?" }
];

export default function App() {
  const [dadosBanco, setDadosBanco] = useState<{data_id: number, nome: string}[]>([]);
  const [mostrarGif, setMostrarGif] = useState(false);
  const [mostrarConfirmacaoFalta, setMostrarConfirmacaoFalta] = useState(false);
  const [gifAtual, setGifAtual] = useState(LISTA_GIFS[0]);
  const [ultimoIndexGif, setUltimoIndexGif] = useState<number | null>(null);
  const [pessoaAtual, setPessoaAtual] = useState("");

  const buscarDados = async () => {
    const { data } = await supabase.from("conclusoes_lixo").select("data_id, nome_colaborador");
    if (data) {
      setDadosBanco(data.map(item => ({ data_id: Number(item.data_id), nome: item.nome_colaborador })));
    }
  };

  useEffect(() => {
    buscarDados();
    const channel = supabase.channel("db-changes").on("postgres_changes", { event: "INSERT", schema: "public", table: "conclusoes_lixo" }, () => buscarDados()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const escalaCompleta = useMemo(() => {
    const escala = [];
    let dataAtual = new Date(2026, 0, 1);
    let faltasAcumuladasTotal = 0;

    while (dataAtual.getDay() !== 5) dataAtual.setDate(dataAtual.getDate() + 1);

    while (dataAtual.getFullYear() === 2026) {
      const dataFormatada = dataAtual.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const idData = dataAtual.getTime();

      if (!FERIADOS_2026.includes(dataFormatada)) {
        // Verifica se houve falta NESTA data específica
        const registroFalta = dadosBanco.find(d => d.data_id === idData && d.nome.includes("FALTOU"));
        
        // O ponteiro da data leva em conta quem já faltou antes + se alguém faltou hoje
        let indexBase = (escala.length + faltasAcumuladasTotal) % COLABORADORES.length;
        
        if (registroFalta) {
          faltasAcumuladasTotal++; // Alguém faltou, incrementa para o próximo nome assumir
          indexBase = (escala.length + faltasAcumuladasTotal) % COLABORADORES.length;
        }

        escala.push({
          id: idData,
          data: dataFormatada,
          nome: COLABORADORES[indexBase],
          fullDate: new Date(dataAtual),
          concluido: dadosBanco.some(d => d.data_id === idData && !d.nome.includes("FALTOU"))
        });
      }
      dataAtual.setDate(dataAtual.getDate() + 7);
    }
    return escala;
  }, [dadosBanco]);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const escalaAtiva = escalaCompleta.filter(item => !item.concluido && item.fullDate >= hoje);

  const handleConfirmar = async (id: number, nome: string) => {
    let novoIndex;
    do { novoIndex = Math.floor(Math.random() * LISTA_GIFS.length); } while (novoIndex === ultimoIndexGif);
    setPessoaAtual(nome);
    setUltimoIndexGif(novoIndex);
    setGifAtual(LISTA_GIFS[novoIndex]);

    const { error } = await supabase.from("conclusoes_lixo").insert([{ data_id: id, nome_colaborador: nome }]);
    if (!error) {
      setMostrarGif(true);
      setTimeout(() => setMostrarGif(false), 5000);
    }
  };

  const confirmarFalta = async () => {
    const itemTopo = escalaAtiva[0];
    if (!itemTopo) return;
    await supabase.from("conclusoes_lixo").insert([{ data_id: itemTopo.id, nome_colaborador: `FALTOU: ${itemTopo.nome}` }]);
    setMostrarConfirmacaoFalta(false);
  };

  return (
    <div className="container">
      <header>
        <h1 className="title">Lista 🗑</h1>
        <p className="subtitle">Escala 2026 </p>
      </header>

      <main className="lista-fila">
        <AnimatePresence mode="popLayout">
          {escalaAtiva.map((item, index) => (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} className={`card ${index === 0 ? "destaque" : ""}`}>
              <div className="info">
                <span className="badge-data">{item.data}</span>
                <div className="user-info">
                  <h3>{item.nome}</h3>
                  <p>{index === 0 ? "🔥 É A VEZ DE AGORA" : "Próxima sexta"}</p>
                </div>
              </div>
              {index === 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn-acao" onClick={() => handleConfirmar(item.id, item.nome)}>Tirei!</button>
                  <button onClick={() => setMostrarConfirmacaoFalta(true)} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid #444", padding: "8px 12px", borderRadius: "12px", cursor: "pointer", fontSize: "0.8rem" }}>Faltou</button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {mostrarConfirmacaoFalta && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" style={{ background: "#1a1a1a", padding: "30px", borderRadius: "24px", border: "1px solid #333" }}>
              <h2>O {escalaAtiva[0]?.nome} faltou hoje?</h2>
              <p style={{ color: "#aaa", margin: "15px 0 25px" }}>O próximo da fila assumirá a responsabilidade por esta mesma data.</p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button onClick={confirmarFalta} className="btn-acao" style={{ background: "#ff4444" }}>Sim, faltou!</button>
                <button onClick={() => setMostrarConfirmacaoFalta(false)} style={{ background: "#333", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", cursor: "pointer" }}>Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarGif && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="modal-content">
              <div className="gif-container"><img src={gifAtual.url} alt="Sucesso" /></div>
              <div className="modal-text">
                <h2 style={{ color: "var(--accent-color)", fontSize: "1.4rem" }}>{gifAtual.texto}</h2>
                <h3 style={{ color: "#fff", fontSize: "2.8rem", fontWeight: "900" }}>{pessoaAtual}</h3>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}