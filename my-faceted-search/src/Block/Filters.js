import React from 'react';

const Filters = ({ value, inputHandler, submitHandler, filters, accordionHandler, handleCheckEvent }) => {
  return  <div className="facet">
    <form action="search">
      <input type="text" id="search" name="search" value={value} onChange={(e)=>inputHandler(e)}/>
      <input type="submit" value="Submit" onClick={(e)=>submitHandler(e)}/>
    </form>
    <div className='facet-filters'>
      {filters.map((e)=> {
        return <div key={e.title}>
          <h3 onClick={(e)=>accordionHandler(e)} className={e.opened ? 'opened' : 'closed'}>{e.title}</h3>
          {e.node.map(el => {
            return <div key={el.id}>
              <input id={el.id} type="radio" value={el.name} name="facet-input" onChange={(e)=>handleCheckEvent(e)}/>
              <label>{el.name}</label>
            </div>
          })}
        </div>
      })}
    </div>
  </div>
}

export default Filters;
