import { fetchUtils, DataProvider } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

const apiUrl = "http://127.0.0.1:8000/api";

// Função utilitária para requisições com autenticação (Token)
const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  const finalHeaders = new Headers(options.headers || {});
  options.headers = finalHeaders;

  if (!finalHeaders.has("Accept")) {
    finalHeaders.set("Accept", "application/json");
  }

  const token = localStorage.getItem("authToken");
  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  // Se o corpo for FormData, não definir Content-Type
  if (options.body instanceof FormData) {
    finalHeaders.delete("Content-Type");

    return fetch(url, options as RequestInit).then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((errorBody) => {
            return Promise.reject({
              status: response.status,
              message: errorBody.message || "Erro de rede",
            });
          })
          .catch(() => {
            return Promise.reject({ status: response.status });
          });
      }

      return response.json().then((json) => ({
        status: response.status,
        headers: response.headers,
        body: "",
        json: json,
      }));
    });
  }

  return fetchUtils.fetchJson(url, options);
};

const baseDataProvider = simpleRestProvider(apiUrl, httpClient);

// Converte dados para JSON ou FormData
const convertDataRequestToHTTP = (
  data: any,
  isUpdate = false
): { data: string | FormData; headers: Record<string, string>; hasFile: boolean } => {
  const requestData = { ...data };

  if (isUpdate) {
    Object.keys(requestData).forEach((key) => {
      const field = requestData[key];
      if (
        (key === "arquivo" || key === "imagem") &&
        field &&
        typeof field === "object" &&
        !field.rawFile
      ) {
        delete requestData[key];
      }
    });
  }

  const hasFileUpload = Object.keys(requestData).some((key) => {
    const field = requestData[key];
    return Array.isArray(field)
      ? field.some(
        (item) => item && typeof item === "object" && item.rawFile instanceof File
      )
      : field && typeof field === "object" && field.rawFile instanceof File;
  });

  if (!hasFileUpload) {
    return {
      data: JSON.stringify(requestData),
      headers: { "Content-Type": "application/json" },
      hasFile: false,
    };
  }

  const formData = new FormData();

  // Adiciona _method=PUT quando for update
  if (isUpdate) {
    formData.append("_method", "PUT");
  }

  const isIsoDateString = (value: string) => {
    if (typeof value !== "string") return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(
      value.replace(/"/g, "")
    );
  };

  Object.keys(requestData).forEach((key) => {
    const field = requestData[key];

    if (field && typeof field === "object" && field.rawFile instanceof File) {
      formData.append(key, field.rawFile, field.title || field.rawFile.name);
    } else if (Array.isArray(field)) {
      const hasFileInArray = field.some(
        (item) => item && typeof item === "object" && item.rawFile instanceof File
      );

      if (hasFileInArray) {
        field.forEach((item) => {
          if (item && typeof item === "object" && item.rawFile instanceof File) {
            formData.append(`${key}[]`, item.rawFile, item.title || item.rawFile.name);
          } else if (item !== null && item !== undefined) {
            formData.append(`${key}[]`, JSON.stringify(item));
          }
        });
      } else {
        formData.append(key, JSON.stringify(field));
      }
    } else if (field && typeof field === "object" && field !== null) {
      let valueToAppend;
      if (field instanceof Date) {
        valueToAppend = field.toISOString();
      } else if (key.startsWith("data_") || isIsoDateString(field)) {
        valueToAppend = String(field).replace(/^"|"$/g, "");
      } else {
        valueToAppend = JSON.stringify(field);
      }
      if (valueToAppend !== undefined) {
        formData.append(key, valueToAppend);
      }
    } else if (field !== null && field !== undefined && field !== "") {
      formData.append(key, String(field));
    }
  });

  return {
    data: formData,
    headers: {},
    hasFile: true,
  };
};

// Data Provider principal
export const dataProvider: DataProvider = {
  ...baseDataProvider,

  // CREATE
  create: async (resource: string, params: any) => {
    const { data: body, headers } = convertDataRequestToHTTP(params.data, false);
    const response = await httpClient(`${apiUrl}/${resource}`, {
      method: "POST",
      body: body,
      headers: headers,
    });

    return {
      data: response.json,
      redirectTo: "list",
    };
  },

  // UPDATE (com suporte a upload via POST + _method=PUT)
  update: async (resource: string, params: any) => {
    const { data: body, headers, hasFile } = convertDataRequestToHTTP(params.data, true);

    const response = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: hasFile ? "POST" : "PUT", // 👈 Se tiver arquivo, envia POST
      body: body,
      headers: headers,
    });

    return {
      data: response.json,
      redirectTo: "list",
    };
  },

  // DELETEMANY
  deleteMany: (resource, params) => {
    const idsToDelete = params.ids.filter((id) => id);
    if (idsToDelete.length === 0) {
      return Promise.resolve({ data: [] });
    }

    return Promise.all(
      idsToDelete.map((id) =>
        httpClient(`${apiUrl}/${resource}/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: new Headers({
            "Content-Type": "text/plain",
          }),
        })
      )
    ).then(() => {
      return { data: idsToDelete };
    });
  },

  // GETONE (normaliza campos de arquivos e imagens)
  getOne: async (resource: string, params: any) => {
    const response = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: "GET",
    });

    const data = response.json;
    const storageBaseUrl = import.meta.env.VITE_API_URL;

    if (data.arquivo && typeof data.arquivo === "string") {
      data.arquivo = {
        src: `${storageBaseUrl}${data.arquivo}`,
        title: data.titulo || data.arquivo.split("/").pop(),
      };
    }

    if (data.imagem && typeof data.imagem === "string") {
      data.imagem = {
        src: `${storageBaseUrl}/imagens/${data.imagem}`,
        title: data.nome + "_logo" || data.imagem.split("/").pop(),
      };
    }

    if (Array.isArray(data.imagens)) {
      data.imagens = data.imagens.map((img: any) => ({
        src: `${storageBaseUrl}/imagens/${img.caminho}`,
        title: img.caminho.split("/").pop(),
      }));
    }

    return { data };
  },
};
