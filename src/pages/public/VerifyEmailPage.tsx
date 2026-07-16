import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Loader2, MailCheck, RefreshCw, XCircle } from 'lucide-react';
import { authApi } from '../../api/authApi';
import BrandLogo from '../../components/BrandLogo';

type VerifyState = 'loading' | 'success' | 'error' | 'missing';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';
  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'missing');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const stateContent = useMemo(() => {
    if (state === 'success') {
      return {
        icon: <CheckCircle2 size={34} className="text-emerald-500" />,
        title: 'Email đã được xác thực',
        description: 'Tài khoản của bạn đã sẵn sàng. Bạn có thể đăng nhập và đặt vé ngay.',
      };
    }

    if (state === 'missing') {
      return {
        icon: <XCircle size={34} className="text-red-500" />,
        title: 'Thiếu mã xác thực',
        description: 'Đường dẫn xác thực không hợp lệ. Vui lòng kiểm tra lại email mới nhất.',
      };
    }

    if (state === 'error') {
      return {
        icon: <XCircle size={34} className="text-red-500" />,
        title: 'Không thể xác thực email',
        description: message || 'Link xác thực có thể đã hết hạn hoặc đã được sử dụng.',
      };
    }

    return {
      icon: <Loader2 size={34} className="animate-spin text-amber-500" />,
      title: 'Đang xác thực email',
      description: 'Vui lòng chờ trong giây lát.',
    };
  }, [message, state]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    authApi.verifyEmail({ token })
      .then(() => {
        if (!cancelled) setState('success');
      })
      .catch((err: any) => {
        if (cancelled) return;
        setMessage(err.response?.data?.message || '');
        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const resendVerification = async () => {
    if (!email.trim()) {
      setResendMessage('Vui lòng nhập email đã đăng ký.');
      return;
    }

    setResendLoading(true);
    setResendMessage('');
    try {
      await authApi.resendVerification({ email: email.trim() });
      setResendMessage('Nếu email tồn tại và chưa xác thực, hệ thống đã gửi lại link mới.');
    } catch {
      setResendMessage('Chưa thể gửi lại email xác thực. Vui lòng thử lại sau.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Xác thực email — cinemabooking.vn</title>
      </Helmet>

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3">
            <BrandLogo className="text-2xl" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-neutral-950">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-slate-50 dark:bg-white/5">
              {stateContent.icon}
            </div>
            <h1 className="text-xl font-black text-slate-950 dark:text-white">{stateContent.title}</h1>
            <p className="mt-2 text-sm leading-6 cinema-muted">{stateContent.description}</p>

            <div className="mt-6 flex flex-col gap-3">
              {state === 'success' && (
                <Link to="/login" className="btn-primary w-full">
                  <MailCheck size={16} />
                  Đăng nhập ngay
                </Link>
              )}

              {(state === 'error' || state === 'missing') && (
                <div className="space-y-3">
                  <input
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    type="email"
                    placeholder="email@example.com"
                    className="cinema-input"
                  />
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={resendLoading}
                    className="btn-primary w-full"
                  >
                    {resendLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Gửi lại email xác thực
                  </button>
                  {resendMessage && (
                    <p className="text-xs font-semibold cinema-muted">{resendMessage}</p>
                  )}
                </div>
              )}

              {state !== 'success' && (
                <Link to="/login" className="text-sm font-black text-amber-600 hover:text-amber-500 dark:text-amber-400">
                  Quay lại đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyEmailPage;
