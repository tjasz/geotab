import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <AppHeader />
      <AppBody />
      <AppFooter />
    </div>
  );
}

function AppHeader() {
  return (
    <header className="App-header">
        <h1>OpenRoutes</h1>
        <p>An open tool for viewing and filtering GPS routes.</p>
      </header>
  );
}

function AppFooter() {
  return (
    <footer className="App-footer">
        <p>&copy; 2022 Tyler Jaszkowiak</p>
      </footer>
  );
}

function AppBody() {
  return (
    <div class="App-body"></div>
  );
}

export default App;
