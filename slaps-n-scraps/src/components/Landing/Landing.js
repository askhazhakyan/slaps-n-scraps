import React from 'react'
import black_logo from '../../images/black_logo.PNG'
import './Landing.css'

const Landing = () => {
  return (
    <div>
        <header className="App-header">
        <img src={black_logo} className="App-logo" alt="logo" />
        <p>
          SLAPS N' SCRAPS
        </p>
      </header>
      <div className='scrollDownArrow'>
        <svg className="arrows">
                <path className="a1" d="M0 0 L20 22 L40 0"></path>
                <path className="a2" d="M0 20 L20 42 L40 20"></path>
        </svg>
      </div>
    </div>
  )
}

export default Landing