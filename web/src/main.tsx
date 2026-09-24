import { ApolloProvider } from '@apollo/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { client } from './gql/client';
import { IssueDetailPage } from './routes/IssueDetailPage';
import { IssueListPage } from './routes/IssueListPage';
import { DesignSystemPage } from './routes/DesignSystemPage';
import { NotFoundPage } from './routes/NotFoundPage';
import './styles/global.css';
import './styles/interaction.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/issues" replace /> },
      { path: 'issues', element: <IssueListPage /> },
      { path: 'design-system', element: <DesignSystemPage /> },
      { path: 'issues/:key', element: <IssueDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>
  </StrictMode>,
);
