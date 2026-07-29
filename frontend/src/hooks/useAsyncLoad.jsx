import { useCallback, useEffect, useState } from 'react';
import ApiErrorState, { formatApiError } from '../components/ApiErrorState';
import { LoadingPage } from '../components/UI';

export function useAsyncLoad(loadFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return Promise.resolve(loadFn())
      .then((result) => setData(result))
      .catch((err) => {
        if (err.response) {
          setError(formatApiError(err));
        } else {
          const network = /reach|WiFi|network/i.test(err.message || '');
          setError({
            kind: network ? 'network' : 'server',
            title: network ? 'Cannot reach the server' : 'Something went wrong',
            message: err.message || 'Please try again.',
          });
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  const renderState = (renderContent) => {
    if (loading) return <LoadingPage />;
    if (error) {
      return (
        <ApiErrorState
          title={error.title}
          message={error.message}
          kind={error.kind}
          onRetry={reload}
        />
      );
    }
    if (!data) return null;
    return renderContent(data);
  };

  return { data, loading, error, reload, renderState };
}
