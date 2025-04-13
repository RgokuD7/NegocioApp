import { useState } from "react";
import { Download, Upload } from "lucide-react";

const DatabaseTab = () => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const savePath = await window.electron.system.selectSavePath(); // Ajusta el nombre de la función exportData

      if (!savePath) {
        setExportStatus("No se seleccionó ninguna ruta.");
        return;
      }
      console.log(savePath);
      const result = await window.electron.database.exportData(savePath); // Llama a la función de exportación
      setExportStatus(result.message);
    } catch (error) {
      setExportStatus("Error al exportar los datos.");
      console.error("Error exportando los datos:", error);
    }
  };

  const handleImport = async () => {
    try {
      const filepath = await window.electron.system.selectFile(); // Llama a la función de selección de archivo
      if (!filepath) {
        setImportStatus("No se seleccionó ningún archivo.");
        return;
      }
      setFileName(filepath);
      const result = await window.electron.database.importData(filepath); // Llama a la función de importación
      setImportStatus(result.message);
    } catch (error) {
      setImportStatus("Error al importar los datos.");
      console.error("Error importando los datos:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
          <Download size={20} />
          Exportar base de datos
        </button>

        <button
          onClick={handleImport}
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#007566] text-[#007566] rounded-lg hover:bg-[#007566] hover:text-white">
          <Upload size={20} />
          Importar base de datos
          {/* Este input de archivo será invisible, pero activado cuando se hace clic en el botón */}
        </button>
      </div>

      {fileName && (
        <div className="mt-4 text-gray-600">
          <p>Archivo seleccionado: {fileName}</p>
        </div>
      )}

      {/*       <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Formato de exportación</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              value="sql"
              defaultChecked
              className="text-[#007566]"
            />
            <span>SQL</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              value="csv"
              className="text-[#007566]"
            />
            <span>CSV</span>
          </label>
        </div>
      </div> */}

      {importStatus && (
        <div className="mt-4 text-green-600">
          <p>{importStatus}</p>
        </div>
      )}
      {exportStatus && (
        <div className="mt-4 text-green-600">
          <p>{exportStatus}</p>
        </div>
      )}
    </div>
  );
};

export default DatabaseTab;
