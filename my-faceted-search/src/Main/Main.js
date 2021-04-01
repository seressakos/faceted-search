import React, { Component } from 'react';

class Main extends Component {
  constructor() {
    super();
    this.state = {
        categories: [],
        cards: [],
        urls: [],
    }
  }

  getContent = () => {
    const categories = [...this.state.categories];
    categories.map(element=> {
      this.setState({cards: []});
      this.setState({urls: []})

      if (element.isChecked === true) {
      
        Promise.all([
          fetch(`https://devportalawards.org/jsonapi/node/nominees?filter[field_categories.drupal_internal__tid]=${element.id}&include=field_site_image&fields[file--file]=uri`, {'method': 'GET'}),
        ])
          .then(values => Promise.all(values.map(value => value.json())))
          .then(data => {
            let cards = [...this.state.cards];

            data[0]['data'].map((element, index)=> {
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
         }) 
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

        this.setState({cards:[
          ...this.state.cards,
          ...data[1]['data'].map((element, index) => {
            return {
              imageurl: "https://devportalawards.org/" + data[1]['included'][index]['attributes']['uri']['url'],
              title: element['attributes']['title'].toString(),
              sitelink: element['attributes']['field_sitelink'][0]['uri'],
            }
          })
          ]
        })
      })

      const getUrls = (url) => {
          Promise.all([
            fetch(`${url}`, {'method': 'GET'}, {'method': 'GET'}),
          ])
          .then(values => Promise.all(values.map(value => value.json())))
          .then(data=>{
            if (data[0]['links']['next']) {
              url = data[0]['links']['next']['href'];
              urls.push(url)
              getUrls(url);
            }
          });
      }

      getUrls(urls[0]);

      this.setState({urls: urls})

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
