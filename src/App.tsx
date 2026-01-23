import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLABORADORES = ["Dinamite", "Denise", "Felix"];

const FERIADOS_2026 = [
  "01/01", "16/02", "17/02", "03/04", "21/04", "01/05", 
  "04/06", "07/09", "12/10", "02/11", "15/11", "20/11", "25/12"
];

const LISTA_GIFS = [
  { url: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTZqczVmNnhvOGZ1amVvanFxaHp1bDlienFiNDNsOTBtNnVxMnVxcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TR996IaHtmDi1x98zW/giphy.gif", texto: "Tirou os Lixos do Estoque ou meteu o louco?" },
  { url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3hpN3Q0cWtldjI1MHV2dndiYzRjMmN3aGgzMWIzNGpodzB0aXBnNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LR5GeZFCwDRcpG20PR/giphy.gif", texto: "Boa familia! Bom descanso!" },
  { url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2FhZnZvZDZrOXlqeHEydm5zM2FnNHY1MDV3MHZzNnV3dmk0bWE1cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yoJC2GnSClbPOkV0eA/giphy.gif", texto: "Sextooooou vamos embora!" }
];

export default function App() {
  const [mostrarGif, setMostrarGif] = useState(false);
  const [gifAtual, setGifAtual] = useState(LISTA_GIFS[0]);
  const [ultimoIndexGif, setUltimoIndexGif] = useState<number | null>(null);

  // 1. Gera a escala completa do ano de 2026 uma única vez
  const escalaCompleta = useMemo(() => {
    const escala = [];
    let dataAtual = new Date(2026, 0, 1); // Janeiro de 2026
    let pointerColaborador = 0;

    while (dataAtual.getDay() !== 5) {
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    while (dataAtual.getFullYear() === 2026) {
      const dataFormatada = dataAtual.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

      if (!FERIADOS_2026.includes(dataFormatada)) {
        escala.push({
          id: dataAtual.getTime(), // ID único baseado no timestamp
          data: dataFormatada,
          nome: COLABORADORES[pointerColaborador],
          fullDate: new Date(dataAtual)
        });
        pointerColaborador = (pointerColaborador + 1) % COLABORADORES.length;
      }
      dataAtual.setDate(dataAtual.getDate() + 7);
    }
    return escala;
  }, []);

  // 2. Estado para controlar quais datas já foram "concluídas"
  const [concluidos, setConcluidos] = useState<number[]>([]);

  // 3. Filtra a escala para mostrar apenas o que não foi concluído e que é de hoje em diante
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const escalaAtiva = escalaCompleta.filter(item => 
    !concluidos.includes(item.id) && item.fullDate >= hoje
  );

  const handleConfirmar = (id: number) => {
    // Sorteia GIF sem repetir
    let novoIndex: number;
    do {
      novoIndex = Math.floor(Math.random() * LISTA_GIFS.length);
    } while (novoIndex === ultimoIndexGif);

    setUltimoIndexGif(novoIndex);
    setGifAtual(LISTA_GIFS[novoIndex]);
    setMostrarGif(true);

    // Após o GIF, remove o item do topo
    setTimeout(() => {
      setConcluidos(prev => [...prev, id]);
      setMostrarGif(false);
    }, 5000);
  };

  return (
    <div className="container">
      <header>
        <h1 className="title">Vez do Lixo 🗑</h1>
        <p className="subtitle">Próximas sextas úteis de 2026</p>
      </header>

      <main className="lista-fila">
        <AnimatePresence mode="popLayout">
          {escalaAtiva.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`card ${index === 0 ? "destaque" : ""}`}
            >
              <div className="info">
                <span className="badge-data">
                  {item.data}
                </span>
                <div className="user-info">
                  <h3>{item.nome}</h3>
                  <p>{index === 0 ? "🔥 É A VEZ DE AGORA" : "Próxima sexta"}</p>
                </div>
              </div>

              {index === 0 && (
                <button className="btn-acao" onClick={() => handleConfirmar(item.id)}>
                  Tirei!
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* MODAL DO GIF */}
      <AnimatePresence>
        {mostrarGif && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overlay">
            <div className="modal-content">
              <div className="gif-container">
                <img src={gifAtual.url} alt="Sucesso" />
              </div>
              <div className="modal-text">
                <h2 style={{ color: "var(--accent-color)", fontSize: "1.4rem" }}>{gifAtual.texto}</h2>
                <h3 style={{ color: "#fff", fontSize: "2.8rem", fontWeight: "900" }}>{escalaAtiva[0]?.nome}</h3>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}