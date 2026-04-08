import client from './client'

export const authApi = {
  register:        (data) => client.post('/register', data),
  login:           (data) => client.post('/login', data),
  logout:          (refreshToken) => client.post('/logout', { refresh_token: refreshToken }),
  refresh:         (refreshToken) => client.post('/refresh', { refresh_token: refreshToken }),

  verifyEmail:     (token) => client.get(`/verify-email?token=${token}`),

  forgotPassword:  (email) => client.post('/forgot-password', { email }),
  resetPassword:   (token, newPassword) =>
    client.post('/reset-password', { token, new_password: newPassword }),

  verify2FA:       (email, otp) => client.post('/verify-2fa', { email, otp }),
  enable2FA:       (enable) => client.post('/enable-2fa', { enable }),

  getMe:           () => client.get('/me'),
  uploadProfileImage: (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/me/profile-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
