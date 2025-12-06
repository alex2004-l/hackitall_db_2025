import HomePage from './pages/HomePage'
import './App.css'

function App() {

  return (
    <>
      <div className="card">
        <HomePage onStart={() => alert('Game Started!')} />
      </div>
    </>
  )
}

export default App;
