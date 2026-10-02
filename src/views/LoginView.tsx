import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RegCobreLogo } from '../components/RegCobreLogo';
import { UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('carlos.eduardo');
  const [password, setPassword] = useState('••••••••••••');
  const [profile, setProfile] = useState<UserRole>('cobrador');
  const [saveCredentials, setSaveCredentials] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      login(username, profile);
      setIsLoading(false);
      setToastMessage(
        `Bem-vindo, ${username}! Carregando painel de ${profile.toUpperCase()}...`
      );
      setTimeout(() => {
        onLoginSuccess();
      }, 600);
    }, 800);
  };

  const handleSsoLogin = () => {
    setIsLoading(true);
    setToastMessage('Consultando tíquete Kerberos / Active Directory institucional...');
    setTimeout(() => {
      login('carlos.eduardo', 'cobrador');
      setIsLoading(false);
      onLoginSuccess();
    }, 900);
  };

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Top Header */}
      <header className="w-full py-space-md px-margin flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest/50">
        <div className="flex items-center gap-space-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
          <span className="font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider">
            Ambiente Corporativo Seguro
          </span>
        </div>
        <div className="flex items-center gap-space-sm font-data-mono text-data-mono text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
          <span>Sessão Isolada</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-margin-mobile md:px-margin py-space-lg relative overflow-hidden">
        {/* Subtle Ambient Glow Orbs */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-gradient-to-b from-secondary/10 via-primary-container/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 right-1/4 w-[420px] h-[260px] bg-secondary-container/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Central Authentication Card */}
        <div className="relative w-full max-w-xl mx-auto z-10">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl p-space-xl md:p-space-2xl border border-outline-variant/30">
            {/* Top Brand Block */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-space-sm">
                <RegCobreLogo size="lg" variant="light" />
              </div>

              <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight mt-1 font-bold">
                Portal de Acesso Operacional & Gerencial
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
                Gestão Integrada de Recuperação de Crédito e Cobrança
              </p>

              {/* Corporate Security Badge */}
              <div className="inline-flex items-center gap-space-xs mt-space-sm px-space-sm py-space-2xs rounded-full bg-surface-container-low text-on-surface-variant font-label-uppercase text-label-uppercase">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span>Ambiente Corporativo Seguro • Rede Interna</span>
              </div>
            </div>

            {/* Authentication Form */}
            <form className="mt-space-xl space-y-space-md" onSubmit={handleSubmit}>
              {/* Field 1: Usuário / Matrícula */}
              <div className="flex flex-col gap-space-2xs">
                <div className="flex items-center justify-between">
                  <label
                    className="font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider"
                    htmlFor="usernameInput"
                  >
                    Usuário de Rede ou Matrícula
                  </label>
                  <span className="font-data-mono text-badge-sm text-secondary font-semibold">
                    Ex: carlos.eduardo / RC-4412
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-space-sm text-outline pointer-events-none text-[18px]">
                    badge
                  </span>
                  <input
                    className="w-full h-9 pl-9 pr-3 rounded bg-surface-container-low text-on-surface font-body-md text-body-md transition-colors placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/40 focus:border-primary-container"
                    id="usernameInput"
                    placeholder="Informe seu usuário de rede ou matrícula"
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Field 2: Senha */}
              <div className="flex flex-col gap-space-2xs">
                <div className="flex items-center justify-between">
                  <label
                    className="font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider"
                    htmlFor="passwordInput"
                  >
                    Senha Corporativa
                  </label>
                  <button
                    type="button"
                    className="font-body-sm text-body-sm text-secondary hover:text-on-secondary-container transition-colors cursor-pointer"
                    onClick={() => {
                      setToastMessage('Instruções para redefinição enviadas para a equipe de TI local (Ramal 4000).');
                      setTimeout(() => setToastMessage(null), 4000);
                    }}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-space-sm text-outline pointer-events-none text-[18px]">
                    lock
                  </span>
                  <input
                    className="w-full h-9 pl-9 pr-10 rounded bg-surface-container-low text-on-surface font-body-md text-body-md transition-colors placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/40 focus:border-primary-container"
                    id="passwordInput"
                    placeholder="Digite sua senha institucional"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    aria-label="Alternar visibilidade da senha"
                    className="absolute right-space-sm text-outline hover:text-on-surface transition-colors flex items-center justify-center p-1 cursor-pointer"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title="Mostrar/Ocultar Senha"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Field 3: Perfil / Unidade de Trabalho */}
              <div className="flex flex-col gap-space-2xs">
                <label
                  className="font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider"
                  htmlFor="profileSelect"
                >
                  Perfil de Acesso / Estação
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-space-sm text-outline pointer-events-none text-[18px]">
                    supervised_user_circle
                  </span>
                  <select
                    className="w-full h-9 pl-9 pr-8 rounded bg-surface-container-low text-on-surface font-body-md text-body-md appearance-none transition-colors focus:outline-none focus:bg-surface-container-lowest cursor-pointer border border-outline-variant/40"
                    id="profileSelect"
                    value={profile}
                    onChange={(e) => setProfile(e.target.value as UserRole)}
                  >
                    <option value="cobrador">Cobrador (Operação de Cobrança & Negociação)</option>
                    <option value="supervisor">Supervisão / Gerência Operacional</option>
                    <option value="administrador">Administrador de Sistemas & Parâmetros</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-space-sm text-outline pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Gravar dados de acesso nesta estação */}
              <div className="p-space-md rounded-lg bg-surface-container-low transition-all duration-200 border border-outline-variant/20">
                <div className="flex items-start gap-space-sm">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="saveCredentialsCheckbox"
                      type="checkbox"
                      checked={saveCredentials}
                      onChange={(e) => setSaveCredentials(e.target.checked)}
                      className="w-4 h-4 rounded text-secondary bg-surface-container-lowest cursor-pointer focus:ring-0"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-space-xs">
                      <label
                        className="font-headline-sm text-[0.875rem] font-semibold text-on-surface cursor-pointer select-none"
                        htmlFor="saveCredentialsCheckbox"
                      >
                        Gravar dados de acesso nesta estação de trabalho
                      </label>
                      <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-badge-sm text-badge-sm">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Dispositivo Confiável
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Mantém seu usuário e preferências salvos neste navegador para agilizar o próximo login nesta máquina corporativa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-space-xs flex flex-col gap-space-sm">
                <button
                  className="w-full h-10 px-space-md rounded bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-title-md flex items-center justify-center gap-space-sm shadow-sm transition-all duration-150 active:scale-[0.99] cursor-pointer"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      <span>Validando credenciais corporativas...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      <span>Entrar no Sistema RegCobre</span>
                    </>
                  )}
                </button>

                <button
                  className="w-full h-9 px-space-md rounded bg-surface-container text-on-surface hover:bg-surface-variant font-headline-sm text-body-md flex items-center justify-center gap-space-sm transition-colors cursor-pointer"
                  onClick={handleSsoLogin}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">hub</span>
                  <span>Autenticar via Acesso Integrado (SSO Active Directory / Windows)</span>
                </button>
              </div>
            </form>

            {/* Footer Status inside Card */}
            <div className="mt-space-xl pt-space-md flex flex-col gap-space-sm text-center border-t border-outline-variant/30">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Ambiente restrito aos operadores e supervisores autorizados da empresa.
              </p>

              <div className="inline-flex items-center justify-center flex-wrap gap-x-space-sm gap-y-1 py-space-xs px-space-sm rounded bg-surface-container font-data-mono text-data-mono text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-secondary">security</span>
                  Conexão Criptografada SSL/TLS 256 bits
                </span>
                <span className="text-outline-variant hidden sm:inline">•</span>
                <span className="flex items-center gap-1 font-semibold text-on-surface">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  IP Interno 192.168.10.42 Detectado
                </span>
              </div>

              <div className="flex items-center justify-center gap-space-md font-body-sm text-body-sm text-on-surface-variant mt-1">
                <a className="hover:text-secondary flex items-center gap-1 transition-colors" href="tel:4000">
                  <span className="material-symbols-outlined text-[14px]">phone_in_talk</span>
                  Suporte TI Interno (Ramal 4000)
                </a>
                <span className="text-outline-variant">•</span>
                <button
                  type="button"
                  className="hover:text-secondary flex items-center gap-1 transition-colors cursor-pointer"
                  onClick={() => {
                    setToastMessage('Norma Corporativa NC-084: O compartilhamento de credenciais constitui infração disciplinar severa.');
                    setTimeout(() => setToastMessage(null), 4000);
                  }}
                >
                  <span className="material-symbols-outlined text-[14px]">policy</span>
                  Políticas de Segurança
                </button>
              </div>
            </div>
          </div>

          {/* Metadata Footing */}
          <div className="mt-space-sm flex items-center justify-between px-space-xs font-data-mono text-badge-sm text-on-surface-variant">
            <span>Autenticação Centralizada RegCobre Corp</span>
            <span>v3.8.4-corp • Build 2024.11</span>
          </div>
        </div>

        {/* Feedback Toast */}
        {toastMessage && (
          <div className="fixed bottom-space-lg right-space-lg max-w-sm p-space-md rounded-lg shadow-xl bg-inverse-surface text-inverse-on-surface z-50 flex items-center gap-space-sm font-body-sm text-body-sm animate-fade-in">
            <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
              check_circle
            </span>
            <span>{toastMessage}</span>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="w-full py-space-md px-margin border-t border-outline-variant/20 bg-surface-container-lowest/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-space-sm font-badge-sm text-badge-sm text-on-surface-variant">
          <div className="flex items-center flex-wrap justify-center gap-space-md">
            <span className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[14px] text-secondary">domain</span>
              Rede Interna Corp
            </span>
            <span className="text-outline-variant">•</span>
            <span className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
              TLS 1.3
            </span>
            <span className="text-outline-variant">•</span>
            <span className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[14px] text-secondary">enhanced_encryption</span>
              Criptografia ponta a ponta
            </span>
          </div>
          <div className="flex items-center gap-space-xs font-data-mono text-data-mono">
            <span className="material-symbols-outlined text-[14px] text-outline">terminal</span>
            <span>v3.8.4-corp</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
