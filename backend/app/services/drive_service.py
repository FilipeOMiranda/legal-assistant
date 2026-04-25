import io
import json
from typing import List, Dict, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import docx
import fitz  # PyMuPDF
from app.core.config import settings


SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Mimetypes suportados
MIME_EXPORTABLE = {
    "application/vnd.google-apps.document": ("text/plain", ".txt"),
}

MIME_DOWNLOAD = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/pdf": "pdf",
    "text/plain": "txt",
}


def _get_drive_service():
    value = settings.GOOGLE_SERVICE_ACCOUNT_JSON.strip()
    # Aceita JSON inline (produção/Render) ou caminho de arquivo (local)
    if value.startswith("{"):
        info = json.loads(value)
        creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    else:
        creds = service_account.Credentials.from_service_account_file(value, scopes=SCOPES)
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def listar_arquivos(folder_id: str) -> List[Dict]:
    """
    Lista recursivamente todos os arquivos suportados dentro de uma pasta do Drive.
    Retorna lista com: id, name, mimeType, modifiedTime, webViewLink
    """
    service = _get_drive_service()
    arquivos = []
    _listar_recursivo(service, folder_id, arquivos)
    return arquivos


def _listar_recursivo(service, folder_id: str, resultado: List[Dict]):
    query = f"'{folder_id}' in parents and trashed = false"
    page_token = None

    while True:
        response = service.files().list(
            q=query,
            spaces="drive",
            fields="nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink)",
            pageToken=page_token,
        ).execute()

        for arquivo in response.get("files", []):
            mime = arquivo["mimeType"]
            if mime == "application/vnd.google-apps.folder":
                # É uma subpasta, entrar recursivamente
                _listar_recursivo(service, arquivo["id"], resultado)
            elif mime in MIME_EXPORTABLE or mime in MIME_DOWNLOAD:
                resultado.append(arquivo)

        page_token = response.get("nextPageToken")
        if not page_token:
            break


def extrair_texto(arquivo: Dict) -> Optional[str]:
    """
    Extrai o texto de um arquivo do Drive.
    Suporta: Google Docs, .docx, .pdf, .txt
    """
    service = _get_drive_service()
    mime = arquivo["mimeType"]
    file_id = arquivo["id"]

    try:
        if mime in MIME_EXPORTABLE:
            # Google Docs: exportar como texto plano
            export_mime, _ = MIME_EXPORTABLE[mime]
            request = service.files().export_media(fileId=file_id, mimeType=export_mime)
            buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(buffer, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()
            return buffer.getvalue().decode("utf-8", errors="ignore")

        elif mime in MIME_DOWNLOAD:
            # Baixar o arquivo binário
            request = service.files().get_media(fileId=file_id)
            buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(buffer, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()
            buffer.seek(0)

            tipo = MIME_DOWNLOAD[mime]
            if tipo == "docx":
                return _extrair_docx(buffer)
            elif tipo == "pdf":
                return _extrair_pdf(buffer)
            elif tipo == "txt":
                return buffer.read().decode("utf-8", errors="ignore")

    except Exception as e:
        print(f"[Drive] Erro ao extrair '{arquivo['name']}': {e}")
        return None

    return None


def _extrair_docx(buffer: io.BytesIO) -> str:
    doc = docx.Document(buffer)
    partes = []
    for paragrafo in doc.paragraphs:
        texto = paragrafo.text.strip()
        if texto:
            partes.append(texto)
    return "\n".join(partes)


def _extrair_pdf(buffer: io.BytesIO) -> str:
    pdf = fitz.open(stream=buffer.read(), filetype="pdf")
    partes = []
    for pagina in pdf:
        texto = pagina.get_text("text")
        if texto.strip():
            partes.append(texto)
    return "\n".join(partes)
