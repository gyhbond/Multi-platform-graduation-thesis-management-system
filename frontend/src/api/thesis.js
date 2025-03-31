import request from './index'

export const getMyThesis = () => {
  return request({
    url: '/api/thesis/my-thesis',
    method: 'get'
  })
}

export const submitThesis = (data) => {
  return request({
    url: '/api/thesis/submit',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const getTeacherThesisList = () => {
  return request({
    url: '/api/thesis/teacher/list',
    method: 'get'
  })
}

export const reviewThesis = (thesisId, data) => {
  return request({
    url: `/api/thesis/${thesisId}/review`,
    method: 'put',
    data
  })
}

export const saveAnnotations = (thesisId, annotations) => {
  return request({
    url: `/api/thesis/${thesisId}/annotations`,
    method: 'post',
    data: { annotations }
  })
}

export const downloadThesis = (thesisId) => {
  return request({
    url: `/api/thesis/${thesisId}/download`,
    method: 'get',
    responseType: 'blob'
  })
}

export const uploadAnnotatedDocument = (thesisId, formData) => {
  return request({
    url: `/api/thesis/${thesisId}/annotated-document`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const downloadAnnotatedDocument = (thesisId) => {
  return request({
    url: `/api/thesis/${thesisId}/annotated-document/download`,
    method: 'get',
    responseType: 'blob'
  })
} 