import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';
import * as apiService from '../services/apiService';

export default function MyPage() {
  const { user, logout, refreshUser } = useAuth();
  const { isOnline, xLoginEnabled, mastodonLoginEnabled, mastodonServerName } = useConnection();
  const navigate = useNavigate();

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 이메일 변경
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // X 연동
  const [xError, setXError] = useState('');
  const [xSuccess, setXSuccess] = useState('');
  const [xLoading, setXLoading] = useState(false);

  // Mastodon 연동
  const [mastodonError, setMastodonError] = useState('');
  const [mastodonSuccess, setMastodonSuccess] = useState('');
  const [mastodonLoading, setMastodonLoading] = useState(false);

  // 계정 삭제
  const [deleteStep, setDeleteStep] = useState(0); // 0: 초기, 1: 1차 확인, 2: 2차 확인
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const isXUser = user.email?.endsWith('@x.user');

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      await refreshUser();
      setPasswordSuccess('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (!newEmail) {
      setEmailError('새 이메일을 입력해주세요.');
      return;
    }

    setEmailLoading(true);
    try {
      await apiService.changeEmail(newEmail);
      await refreshUser();
      setEmailSuccess('이메일이 변경되었습니다.');
      setNewEmail('');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : '이메일 변경에 실패했습니다.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleLinkX = async () => {
    setXError('');
    setXSuccess('');
    setXLoading(true);
    try {
      const { authorizeUrl } = await apiService.getXLoginUrl();
      // X 연동 모드임을 localStorage에 저장
      localStorage.setItem('x_link_mode', 'true');
      window.location.href = authorizeUrl;
    } catch (err) {
      setXError(err instanceof Error ? err.message : 'X 연동을 시작할 수 없습니다.');
      setXLoading(false);
    }
  };

  const handleUnlinkX = async () => {
    setXError('');
    setXSuccess('');
    setXLoading(true);
    try {
      await apiService.unlinkXAccount();
      setXSuccess('X 계정 연동이 해제되었습니다.');
      await refreshUser();
    } catch (err) {
      setXError(err instanceof Error ? err.message : 'X 연동 해제에 실패했습니다.');
    } finally {
      setXLoading(false);
    }
  };

  const handleLinkMastodon = async () => {
    setMastodonError('');
    setMastodonSuccess('');
    setMastodonLoading(true);
    try {
      const { authorizeUrl } = await apiService.getMastodonLoginUrl();
      localStorage.setItem('mastodon_link_mode', 'true');
      window.location.href = authorizeUrl;
    } catch (err) {
      setMastodonError(err instanceof Error ? err.message : 'Mastodon 연동을 시작할 수 없습니다.');
      setMastodonLoading(false);
    }
  };

  const handleUnlinkMastodon = async () => {
    setMastodonError('');
    setMastodonSuccess('');
    setMastodonLoading(true);
    try {
      await apiService.unlinkMastodonAccount();
      setMastodonSuccess('Mastodon 계정 연동이 해제되었습니다.');
      await refreshUser();
    } catch (err) {
      setMastodonError(err instanceof Error ? err.message : 'Mastodon 연동 해제에 실패했습니다.');
    } finally {
      setMastodonLoading(false);
    }
  };

  // X 연동 해제 가능 여부: 비밀번호 또는 Mastodon 연동이 있어야 함
  const canUnlinkX = user.hasPassword || user.mastodonLinked;
  // Mastodon 연동 해제 가능 여부: 비밀번호 또는 X 연동이 있어야 함
  const canUnlinkMastodon = user.hasPassword || user.xLinked;

  const handleDeleteAccount = async () => {
    if (deleteStep < 2) {
      setDeleteStep(deleteStep + 1);
      return;
    }

    setDeleteError('');
    setDeleteLoading(true);
    try {
      await apiService.deleteAccount();
      await logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '계정 삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="row" style={{ paddingTop: '10px' }}>
      <div className="col-md-8">
        <h2>마이페이지</h2>

        {/* 계정 정보 */}
        <div className="card mb-3">
          <div className="card-header"><strong>계정 정보</strong></div>
          <div className="card-body">
            <div className="mb-2">
              <strong>닉네임:</strong> {user.username}
            </div>
            <div className="mb-2">
              <strong>이메일:</strong> {isXUser ? <span className="text-muted">미설정 (X 로그인 계정)</span> : user.email}
            </div>
            <div className="mb-2">
              <strong>비밀번호:</strong> {user.hasPassword ? '설정됨' : <span className="text-muted">미설정</span>}
            </div>
            <div className="mb-2">
              <strong>X 연동:</strong> {user.xLinked ? <span className="badge bg-success">연동됨</span> : <span className="badge bg-secondary">미연동</span>}
            </div>
            <div>
              <strong>Mastodon 연동:</strong> {user.mastodonLinked ? <span className="badge bg-success">연동됨</span> : <span className="badge bg-secondary">미연동</span>}
            </div>
          </div>
        </div>

        {/* 이메일 변경 (X 로그인 사용자 또는 일반 사용자) */}
        <div className="card mb-3">
          <div className="card-header"><strong>{isXUser ? '이메일 설정' : '이메일 변경'}</strong></div>
          <div className="card-body">
            {emailError && <div className="alert alert-danger py-2">{emailError}</div>}
            {emailSuccess && <div className="alert alert-success py-2">{emailSuccess}</div>}
            <form onSubmit={handleEmailChange}>
              <div className="mb-3">
                <label htmlFor="newEmail" className="form-label">
                  {isXUser ? '이메일 주소' : '새 이메일 주소'}
                </label>
                <input
                  id="newEmail"
                  type="email"
                  className="form-control"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required
                  disabled={!isOnline || emailLoading}
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isOnline || emailLoading}
              >
                {emailLoading ? '변경 중...' : (isXUser ? '이메일 설정' : '이메일 변경')}
              </button>
            </form>
          </div>
        </div>

        {/* 비밀번호 변경/설정 */}
        <div className="card mb-3">
          <div className="card-header"><strong>{user.hasPassword ? '비밀번호 변경' : '비밀번호 설정'}</strong></div>
          <div className="card-body">
            {passwordError && <div className="alert alert-danger py-2">{passwordError}</div>}
            {passwordSuccess && <div className="alert alert-success py-2">{passwordSuccess}</div>}
            <form onSubmit={handlePasswordChange}>
              {user.hasPassword && (
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">현재 비밀번호</label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    disabled={!isOnline || passwordLoading}
                    autoComplete="current-password"
                  />
                </div>
              )}
              <div className="mb-3">
                <label htmlFor="newPassword" className="form-label">
                  {user.hasPassword ? '새 비밀번호' : '비밀번호'}
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={!isOnline || passwordLoading}
                  autoComplete="new-password"
                />
                <div className="form-text">8자 이상 입력해주세요.</div>
              </div>
              <div className="mb-3">
                <label htmlFor="newPasswordConfirm" className="form-label">
                  {user.hasPassword ? '새 비밀번호 확인' : '비밀번호 확인'}
                </label>
                <input
                  id="newPasswordConfirm"
                  type="password"
                  className="form-control"
                  value={newPasswordConfirm}
                  onChange={e => setNewPasswordConfirm(e.target.value)}
                  required
                  disabled={!isOnline || passwordLoading}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isOnline || passwordLoading}
              >
                {passwordLoading ? '처리 중...' : (user.hasPassword ? '비밀번호 변경' : '비밀번호 설정')}
              </button>
            </form>
          </div>
        </div>

        {/* X 계정 연동 */}
        {xLoginEnabled && (
          <div className="card mb-3">
            <div className="card-header"><strong>X 계정 연동</strong></div>
            <div className="card-body">
              {xError && <div className="alert alert-danger py-2">{xError}</div>}
              {xSuccess && <div className="alert alert-success py-2">{xSuccess}</div>}
              {user.xLinked ? (
                <div>
                  <p className="mb-2">X 계정이 연동되어 있습니다.</p>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleUnlinkX}
                    disabled={!isOnline || xLoading || !canUnlinkX}
                  >
                    {xLoading ? '처리 중...' : 'X 연동 해제'}
                  </button>
                  {!canUnlinkX && (
                    <div className="form-text text-warning mt-2">
                      비밀번호를 먼저 설정하거나 다른 로그인 수단을 연동해야 X 연동을 해제할 수 있습니다.
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="mb-2">X 계정을 연동하면 X 계정으로도 로그인할 수 있습니다.</p>
                  <button
                    type="button"
                    className="btn btn-dark d-flex align-items-center gap-2"
                    onClick={handleLinkX}
                    disabled={!isOnline || xLoading}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    {xLoading ? '연동 중...' : 'X 계정 연동'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mastodon 계정 연동 */}
        {mastodonLoginEnabled && (
          <div className="card mb-3">
            <div className="card-header"><strong>Mastodon 계정 연동</strong></div>
            <div className="card-body">
              {mastodonError && <div className="alert alert-danger py-2">{mastodonError}</div>}
              {mastodonSuccess && <div className="alert alert-success py-2">{mastodonSuccess}</div>}
              {user.mastodonLinked ? (
                <div>
                  <p className="mb-2">Mastodon 계정이 연동되어 있습니다.</p>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleUnlinkMastodon}
                    disabled={!isOnline || mastodonLoading || !canUnlinkMastodon}
                  >
                    {mastodonLoading ? '처리 중...' : 'Mastodon 연동 해제'}
                  </button>
                  {!canUnlinkMastodon && (
                    <div className="form-text text-warning mt-2">
                      비밀번호를 먼저 설정하거나 다른 로그인 수단을 연동해야 Mastodon 연동을 해제할 수 있습니다.
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="mb-2">Mastodon 계정을 연동하면 Mastodon 계정으로도 로그인할 수 있습니다.</p>
                  <button
                    type="button"
                    className="btn d-flex align-items-center gap-2"
                    style={{ backgroundColor: '#6364FF', color: '#fff', borderColor: '#6364FF' }}
                    onClick={handleLinkMastodon}
                    disabled={!isOnline || mastodonLoading}
                  >
                    <svg style={{ height: '18px', width: 'auto' }} viewBox="0 0 75 79" fill="none" aria-hidden="true">
                      <path d="M73.8393 17.4898C72.6973 9.00165 65.2994 2.31235 56.5296 1.01614C55.05 0.797115 49.4441 0 36.4582 0H36.3612C23.3717 0 20.585 0.797115 19.1054 1.01614C10.5798 2.27644 2.79399 8.28712 0.904997 16.8758C-0.00358524 21.1056 -0.100549 25.7949 0.0682394 30.0965C0.308852 36.2651 0.355538 42.423 0.91577 48.5665C1.30307 52.6474 1.97872 56.6957 2.93763 60.6812C4.73325 68.042 12.0019 74.1676 19.1233 76.6666C26.7478 79.2728 34.9474 79.7055 42.8039 77.9162C43.6682 77.7151 44.5217 77.4817 45.3645 77.216C47.275 76.6092 49.5123 75.9305 51.1571 74.7385C51.1797 74.7217 51.1982 74.7001 51.2112 74.6753C51.2243 74.6504 51.2316 74.6229 51.2325 74.5948V68.6416C51.2321 68.6154 51.2259 68.5896 51.2142 68.5661C51.2025 68.5426 51.1858 68.522 51.1651 68.5058C51.1444 68.4896 51.1204 68.4783 51.0948 68.4726C51.0692 68.4669 51.0426 68.467 51.0171 68.4729C45.9835 69.675 40.8254 70.2777 35.6502 70.2682C26.7439 70.2682 24.3486 66.042 23.6626 64.2826C23.1113 62.762 22.7612 61.1759 22.6212 59.5646C22.6197 59.5375 22.6247 59.5105 22.6357 59.4857C22.6466 59.4609 22.6633 59.4391 22.6843 59.422C22.7053 59.4048 22.73 59.3929 22.7565 59.3871C22.783 59.3813 22.8104 59.3818 22.8367 59.3886C27.7864 60.5826 32.8604 61.1853 37.9522 61.1839C39.1768 61.1839 40.3978 61.1839 41.6224 61.1516C46.7435 61.008 52.1411 60.7459 57.1796 59.7621C57.3053 59.7369 57.431 59.7154 57.5387 59.6831C65.4861 58.157 73.0493 53.3672 73.8178 41.2381C73.8465 40.7606 73.9184 36.2364 73.9184 35.7409C73.9219 34.0569 74.4606 23.7949 73.8393 17.4898Z" fill="url(#paint0_linear_549_34)"/>
                      <path d="M61.2484 27.0263V48.114H52.8916V27.6475C52.8916 23.3388 51.096 21.1413 47.4437 21.1413C43.4287 21.1413 41.4177 23.7409 41.4177 28.8755V40.0782H33.1111V28.8755C33.1111 23.7409 31.0965 21.1413 27.0815 21.1413C23.4507 21.1413 21.6371 23.3388 21.6371 27.6475V48.114H13.2839V27.0263C13.2839 22.7176 14.384 19.2946 16.5843 16.7572C18.8539 14.2258 21.8311 12.926 25.5264 12.926C29.8036 12.926 33.0357 14.5705 35.1905 17.8559L37.2698 21.346L39.3527 17.8559C41.5074 14.5705 44.7395 12.926 49.0095 12.926C52.7013 12.926 55.6784 14.2258 57.9553 16.7572C60.1531 19.2922 61.2508 22.7152 61.2484 27.0263Z" fill="white"/>
                      <defs>
                        <linearGradient id="paint0_linear_549_34" x1="37.0692" y1="0" x2="37.0692" y2="79" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#6364FF"/>
                          <stop offset="1" stopColor="#563ACC"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    {mastodonLoading ? '연동 중...' : (mastodonServerName ? `${mastodonServerName} 연동` : 'Mastodon 계정 연동')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 계정 삭제 */}
        <div className="card mb-3 border-danger">
          <div className="card-header text-danger"><strong>계정 삭제</strong></div>
          <div className="card-body">
            {deleteError && <div className="alert alert-danger py-2">{deleteError}</div>}
            <p className="text-danger mb-2">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>

            {deleteStep === 0 && (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleDeleteAccount}
                disabled={!isOnline || deleteLoading}
              >
                계정 삭제
              </button>
            )}

            {deleteStep === 1 && (
              <div>
                <p className="fw-bold text-danger">정말로 계정을 삭제하시겠습니까?</p>
                <button
                  type="button"
                  className="btn btn-danger me-2"
                  onClick={handleDeleteAccount}
                  disabled={!isOnline || deleteLoading}
                >
                  네, 삭제합니다
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteStep(0)}
                >
                  취소
                </button>
              </div>
            )}

            {deleteStep === 2 && (
              <div>
                <p className="fw-bold text-danger">마지막 확인입니다. 계정 삭제 후에는 복구할 수 없습니다. 정말로 삭제하시겠습니까?</p>
                <button
                  type="button"
                  className="btn btn-danger me-2"
                  onClick={handleDeleteAccount}
                  disabled={!isOnline || deleteLoading}
                >
                  {deleteLoading ? '삭제 중...' : '네, 영구적으로 삭제합니다'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteStep(0)}
                  disabled={deleteLoading}
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
