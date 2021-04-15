import React from 'react';

const Pagination = ({ urls, handlePaginaTion }) => {
  return  <ul>
    {urls.map((url, index) => {
      return <li key={url.url}
                 id={url.id}
                 className={url.active ? 'active' : null}
                 onClick={(e)=>{handlePaginaTion(e)}}>{index + 1}
      </li>
    })}
  </ul>
}

export default Pagination;
