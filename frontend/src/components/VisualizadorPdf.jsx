import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";

export default function VisualizadorPdf({ blob, nomeArquivo, onFechar }) {
  const dialogo = useRef(null);
  const quadro = useRef(null);
  const download = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    quadro.current.src = url;
    download.current.href = url;
    dialogo.current.showModal();
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return createPortal(
    <dialog ref={dialogo} className="pdf-preview"
      aria-labelledby="pdf-preview-titulo"
      onCancel={(event) => { event.preventDefault(); onFechar(); }}>
      <div className="pdf-preview-toolbar">
        <h2 id="pdf-preview-titulo">Contrato em PDF</h2>
        <a ref={download} download={nomeArquivo} className="tab-nav-btn">
          <Download size={16} aria-hidden="true" /> Baixar PDF
        </a>
        <button type="button" className="text-link-btn" autoFocus
          aria-label="Fechar contrato" onClick={onFechar}>
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      <iframe ref={quadro} title="Visualização do contrato em PDF" />
    </dialog>,
    document.body,
  );
}
