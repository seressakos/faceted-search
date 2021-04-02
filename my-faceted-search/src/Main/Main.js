import React, { Component } from 'react';

class Main extends Component {
  constructor() {
    super();
    this.state = {
        categories: [],
        cards: [],
        urls: [],
    }

    this.getUrls = this.getUrls.bind(this);
  }

  
getUrls = (url) => {
  console.log(url)
    Promise.all([
      fetch(`${url}`, {'method': 'GET'}),
    ])
    .then(values => Promise.all(values.map(value => value.json())))
    .then(data=>{
      let urls =[url];
      let cards = [...this.state.cards];

      if (data[0]['links']['next']) {
        url = data[0]['links']['next']['href'];
        urls = [...urls, ...[url]]
        this.setState({urls: [
          ...this.state.urls,
          ...urls
        ]})

        this.getUrls(url);
    
      }

      data[0]['data'].map((element, index)=> {
        console.log(element)
        if (element['attributes']['field_ongoing']) {
          if (!cards.includes(element['attributes']['title'].toString())) {
            cards = [
              ...cards,
              ...[
                {
                  imageurl: "https://devportalawards.org/" + data[0]['included'][index]['attributes']['uri']['url'],
                  title: element['attributes']['title'].toString(),
                  sitelink: element['attributes']['field_sitelink'][0]['uri'],
                }
              ]
            ]
          }
        }
      })

      this.setState({cards: cards});
    });
}


  getContent = () => {
    const categories = [...this.state.categories];
    categories.map(element=> {
      this.setState({cards: []});
      this.setState({urls: []})


      if (element.isChecked === true) {

        this.getUrls(`https://devportalawards.org/jsonapi/node/nominees?filter[field_categories.drupal_internal__tid]=${element.id}&include=field_site_image&fields[file--file]=uri`);
      } 
    })
  }

  handleCheckChieldElement = (event) => {
    let categories = this.state.categories
    categories .forEach(element => {
      if (element.name === event.target.value)
        element.isChecked =  event.target.checked
      })
    this.setState({categories: categories})

    this.getContent();
 }

 handlePaginaTion = (e) => {
  let url = e.currentTarget.attributes.data.nodeValue;
  
  Promise.all([
    fetch(`${url}`, {'method': 'GET'}, {'method': 'GET'}),
  ])
  .then(values => Promise.all(values.map(value => value.json())))
  .then(data=>{
    this.setState({cards:[
      ...data[0]['data'].map((element, index) => {
        return {
          imageurl: "https://devportalawards.org/" + data[0]['included'][index]['attributes']['uri']['url'],
          title: element['attributes']['title'].toString(),
          sitelink: element['attributes']['field_sitelink'][0]['uri'],
        }
      })
      ]
    })
  })
}

  componentDidMount() {
    const urls =['https://devportalawards.org/jsonapi/node/nominees?filter[field_ongoing][value]=1&page[limit]=5&include=field_site_image&fields[file--file]=uri'];
    this.getUrls(urls[0]);

    Promise.all([
      fetch('https://devportalawards.org/jsonapi/taxonomy_term/category', {'method': 'GET'}),
      fetch(urls[0], {'method': 'GET'})
    ])
      .then (values => Promise.all(values.map(value => value.json())))
      .then(data => {
        
        data[0]['data'].map((element, index) => {
          Promise.all([
            fetch(`https://devportalawards.org/jsonapi/node/nominees?filter[field_categories.drupal_internal__tid]=${element['attributes']['drupal_internal__tid']}`, {'method': 'GET'}),
          ])
          .then(values => Promise.all(values.map(value => value.json())))
          .then(data=> {
            this.setState({
              categories: [
                ...this.state.categories,
                ...[
                  {
                    name: element['attributes']['name'],
                    isChecked: false,
                    id: element['attributes']['drupal_internal__tid'],
                    disabled: data[0]['data'].length < 1 ? true : false,
                }
                ]
               ]
            })
          })
        })
      })
  };

  render() {
    return (
      <div>
         <li>
             {this.state.categories.map(input=>{
                 return <div key={input.id}>
                     <input type="checkbox" value={input.name} onChange={this.handleCheckChieldElement} disabled={input.disabled ? true : false}/>
                     <label>{input.name}</label>
                     </div>
             })}
         </li>
         {this.state.cards.map(card=> {
           return <div key={card.title}>
             <h2>{card.title}</h2>
             <img src={card.imageurl}/>
             </div>
         })}
         <div>
           {this.state.urls.map((url, index)=>{
             return <div key={url} data={url} onClick={(e)=>{this.handlePaginaTion(e)}}>{index + 1} </div>
           })}
         </div>
      </div>
    )
  }
}

export default Main;
