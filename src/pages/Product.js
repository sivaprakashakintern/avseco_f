import React from 'react'
import ProductList from './ProductList'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'

const Product = () => {
  return (
    <div>
      <div className="dashboard-wrapper">
      <Sidebar />
      <div className="right-area">
        <Topbar />
        <div className="content-area">
          <ProductList />
        </div>
      </div>
    </div>
    </div>
  )
}

export default Product
