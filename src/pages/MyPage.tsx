import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useConnection } from '../contexts/useConnection';
import * as apiService from '../services/apiService';

export default function MyPage() {
  const { user, logout, refreshUser } = useAuth();
  const { isOnline, xLoginEnabled } = useConnection();
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
            <div>
              <strong>X 연동:</strong> {user.xLinked ? <span className="badge bg-success">연동됨</span> : <span className="badge bg-secondary">미연동</span>}
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
                    disabled={!isOnline || xLoading || !user.hasPassword}
                  >
                    {xLoading ? '처리 중...' : 'X 연동 해제'}
                  </button>
                  {!user.hasPassword && (
                    <div className="form-text text-warning mt-2">
                      비밀번호를 먼저 설정해야 X 연동을 해제할 수 있습니다.
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
