import { fetchUtils, DataProvider } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

const apiUrl = import.meta.env.VITE_API_URL;

const handleError = (response: Response) => {

  return response.json().then((errorBody) => {

    if (response.status === 422 && errorBody.errors) {

      console.log('[handleError] Processando Erro 422. "errors" encontrado:', errorBody.errors);

      const formattedErrors: { [key: string]: string } = {};
      const allErrorMessages: string[] = [];

      // Adicionando mais logs para ter certeza sobre a formatação
      const errorKeys = Object.keys(errorBody.errors);
      console.log('[handleError] Chaves de erro encontradas:', errorKeys); // DEBUG 2.1

      errorKeys.forEach(key => {
        console.log(`[handleError] Processando chave: "${key}"`); // DEBUG 2.2
        const errorValue = errorBody.errors[key];

        if (Array.isArray(errorValue)) {
          console.log(`[handleError] Chave "${key}" é um array:`, errorValue); // DEBUG 2.3
          errorValue.forEach((errorItem, index) => {
            let errorMessage = 'Erro de validação';

            if (typeof errorItem === 'string') {
              errorMessage = errorItem;
            } else if (typeof errorItem === 'object' && errorItem !== null && typeof errorItem.message === 'string') {
              errorMessage = errorItem.message;
            }

            allErrorMessages.push(errorMessage);

            if (index === 0) {
              console.log(`[handleError] Definindo erro para o campo "${key}":`, errorMessage); // DEBUG 2.4
              formattedErrors[key] = errorMessage;
            }
          });
        } else if (typeof errorValue === 'string') {
          console.log(`[handleError] Chave "${key}" é uma string:`, errorValue); // DEBUG 2.5
          allErrorMessages.push(errorValue);
          formattedErrors[key] = errorValue;
        }
      });

      const mainErrorMessage = allErrorMessages.length > 0
        ? allErrorMessages.join('. ')
        : (errorBody.message || "Erro de validação");

      const rejectionPayload = {
        status: response.status,
        message: mainErrorMessage,
        body: { errors: formattedErrors }
      };

      console.log('--- [handleError] Rejeitando para React-Admin (422) ---', rejectionPayload);

      // Esta rejeição será pega pelo .catch() abaixo
      return Promise.reject(rejectionPayload);
    }

    const rejectionPayload = {
      status: response.status,
      message: errorBody.message || `Erro ${response.status}`
    };

    return Promise.reject(rejectionPayload);

  }).catch((error) => {

    if (error && error.status && (error.message || error.body)) {
      return Promise.reject(error);
    }

    return Promise.reject({
      status: response.status,
      message: response.statusText || 'Erro de rede (corpo não-JSON)'
    });
  });
};

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

  if (options.body instanceof FormData) {
    finalHeaders.delete("Content-Type");
  }

  return fetch(url, options as RequestInit)
    .then((response) => {

      if (!response.ok) {
        return handleError(response);
      }

      if (response.status === 204 || response.status === 205) {
        return {
          status: response.status,
          headers: response.headers,
          body: "",
          json: null,
        };
      }

      // Resposta OK com corpo
      return response.json().then((json) => ({
        status: response.status,
        headers: response.headers,
        body: "",
        json: json,
      }));
    })
    .catch((error) => {

      if (error.status) {
        return Promise.reject(error);
      }

      console.error("Erro de rede:", error);

      return Promise.reject({
        status: 0,
        message: error.message || "Não foi possível conectar à API"
      });
    });
};

const baseDataProvider = simpleRestProvider(apiUrl, httpClient);

const convertDataRequestToHTTP = (
  data: any,
  isUpdate = false
): { data: string | FormData; headers: Record<string, string>; hasFile: boolean } => {
  const requestData = { ...data };

  if (isUpdate) {
    Object.keys(requestData).forEach((key) => {
      const field = requestData[key];
      console.log('Processando item de array para FormData:', key, field); // DEBUG
      if (
        (key === "arquivo" || key === "imagem") &&
        field &&
        typeof field === "object" &&
        !field.rawFile
      ) {
        delete requestData[key];
      }
      console.log('Após verificação, item é:', key, requestData[key]); // DEBUG
    });
  }

  const hasFileUpload = Object.keys(requestData).some((key) => {
    const field = requestData[key];
    console.log('Verificando campo para upload de arquivo:', key, field); // DEBUG
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

  if (isUpdate) {
    formData.append("_method", "PUT");
  }

  Object.entries(requestData).forEach(([key, field]) => {

    if (field instanceof File) {
      formData.append(key, field, field.name);

    } else if (Array.isArray(field)) {
      field.forEach((item) => {
        if (item && typeof item === 'object' && 'rawFile' in item && item.rawFile instanceof File) {
          formData.append(`${key}[]`, item.rawFile, item.rawFile.name);

        } else if (item instanceof File) {
          formData.append(`${key}[]`, item, item.name);

        } else if (item !== null && item !== undefined) {
          const valueToAppend = typeof item === 'object' ? JSON.stringify(item) : String(item);
          formData.append(`${key}[]`, valueToAppend);
        }
      });

    } else if (typeof field === "object" && field !== null) {

      if (field && 'rawFile' in field && field.rawFile instanceof File) {
        formData.append(key, field.rawFile, field.rawFile.name);

      } else {
        const valueToAppend = field instanceof Date ? field.toISOString() : JSON.stringify(field);
        if (valueToAppend !== undefined) {
          formData.append(key, valueToAppend);
        }
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

export const dataProvider: DataProvider = {
  ...baseDataProvider,

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

  update: async (resource: string, params: any) => {
    const { data: body, headers, hasFile } = convertDataRequestToHTTP(params.data, true);

    const response = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: hasFile ? "POST" : "PUT",
      body: body,
      headers: headers,
    });

    return {
      data: response.json,
      redirectTo: "list",
    };
  },

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