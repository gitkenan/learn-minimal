import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { WorkflowProvider } from '@/context/WorkflowContext';
import Layout from '@/components/Layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <WorkflowProvider>
        <Layout>
          <Component {...pageProps} />
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable={false}
            pauseOnHover
            theme="light"
          />
        </Layout>
      </WorkflowProvider>
    </AuthProvider>
  );
}
