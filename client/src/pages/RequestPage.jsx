import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getRequestById, respondToRequest } from '../api/requestApi.js';
import { readSession } from '../lib/session.js';

function RequestPage() {
  const { id } = useParams();
  const session = readSession();
  const [request, setRequest] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Загрузка полной карточки заявки.
  useEffect(() => {
    let cancelled = false;

    async function loadRequest() {
      try {
        setLoading(true);
        setErrorMessage('');

        const data = await getRequestById(id);

        if (!cancelled) {
          setRequest(data);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRequest();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Отправка отклика с сообщением.
  async function handleResponseSubmit(event) {
    event.preventDefault();

    try {
      setErrorMessage('');
      setSuccessMessage('');

      const response = await respondToRequest(id, {
        text: responseText
      });

      setRequest((currentRequest) => ({
        ...currentRequest,
        responses: [...currentRequest.responses, response]
      }));
      setResponseText('');
      setSuccessMessage('Отклик отправлен');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <main className="page narrowPage">
      <section className="card detailCardWide">
        {loading && <p className="muted">Загрузка заявки...</p>}

        {!loading && errorMessage && <div className="errorCard">{errorMessage}</div>}

        {!loading && request && (
          <>
            <p className="eyebrow">{request.template.gameName}</p>
            <h1>{request.title}</h1>
            <p className="muted">
              Автор заявки: <strong>{request.user.name}</strong>
            </p>
            <p className="detailText">{request.description}</p>
            {request.template.description && (
              <div className="detailCard templateDetailCard">
                <span className="detailLabel">Описание шаблона</span>
                <p>{request.template.description}</p>
              </div>
            )}

            <div className="detailGrid">
              <div className="detailCard">
                <span className="detailLabel">Тип шаблона</span>
                <strong>{request.template.templateType === 'PLAYER' ? 'Игрок' : 'Команда'}</strong>
              </div>
              <div className="detailCard">
                <span className="detailLabel">Статус</span>
                <strong>{request.status === 'OPEN' ? 'Открыта' : request.status}</strong>
              </div>
              <div className="detailCard">
                <span className="detailLabel">Роль</span>
                <strong>{request.template.preferredRole || 'Не указана'}</strong>
              </div>
              <div className="detailCard">
                <span className="detailLabel">Ранг</span>
                <strong>{request.template.rank || 'Не указан'}</strong>
              </div>
            </div>

            {session && session.user.id !== request.user.id && (
              <form className="responseForm" onSubmit={handleResponseSubmit}>
                {/* Сообщение к отклику. */}
                <label className="field">
                  <span>Сообщение к отклику</span>
                  <textarea
                    value={responseText}
                    onChange={(event) => setResponseText(event.target.value)}
                    placeholder="Сообщение необязательно, но поможет быстрее начать диалог"
                    rows="4"
                  />
                </label>
                <button className="primaryButton" type="submit">
                  Откликнуться
                </button>
              </form>
            )}

            {successMessage && <div className="successCard">{successMessage}</div>}

            <section className="responsesSection">
              <h2>Отклики</h2>
              {request.responses.length === 0 && (
                <p className="muted">На эту заявку пока нет откликов.</p>
              )}
              {request.responses.length > 0 && (
                <div className="responseList">
                  {request.responses.map((response) => (
                    <article className="responseCard" key={response.id}>
                      <strong>{response.responder.name}</strong>
                      <p className="muted">{response.text || 'Без сообщения'}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <Link className="secondaryButton" to="/">
          Вернуться на главную
        </Link>
      </section>
    </main>
  );
}

export default RequestPage;
