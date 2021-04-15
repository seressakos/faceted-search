import React from 'react';

const Card = ({alias, title, imageUrl, owner, category, alt }) => {
  return (
    <div className="views-row">
      <div className="image-block">
        <a href={alias}></a>
        <div className="image">
          <img alt={alt} src={imageUrl} width="500" height="300" typeof="Image" className="img-responsive"/>
        </div>
        <span>{owner}</span>
        <h3>{title}</h3>
      </div>
      <ul className="nomination-categories">
        {category.map(category=>{
          return <li key={category}>{category}</li>
        })}
      </ul>
    </div>
  )
}

export default Card;
