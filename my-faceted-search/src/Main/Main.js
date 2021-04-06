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


  getUrls = (url, currentUrl = url) => {
    Promise.all([
      fetch(`${url}`, {'method': 'GET'}),
    ])
      .then(values => Promise.all(values.map(value => value.json())))
      .then(data=>{

        if (url === currentUrl) {
          let cards = [...this.state.cards];

          data[0]['data'].map((element, index)=> {
            const arrayHasObject = cards.some(el => el.title === element['attributes']['title'].toString());

            if (!arrayHasObject ) {
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
          })

          this.setState({cards: cards});
        }

        let urls =[{
          'url': url,
          'active': true,
        }];


        if (data[0]['links']['next']) {
          const newUrl = data[0]['links']['next']['href'];
          urls = [...urls, ...[{
            'url': newUrl,
            'active': url === newUrl ? true : false,
          }]];

          urls.map((e, index) => {
            e.id = `pagination--item-${index}`
          })

          this.setState({urls: [
              ...this.state.urls,
              ...urls
            ]})


          this.getUrls(newUrl, currentUrl);
        }
      });
  }

  handleCheckChieldElement = (event) => {
    this.setState({cards: []});
    this.setState({urls: []})

    const categories = [...this.state.categories]
    categories .forEach(element => {
      if (element.name === event.target.value)
        element.isChecked =  event.target.checked

      return categories
    })

    categories.map(element=> {

      if (element.isChecked === true) {
        this.getUrls(`https://devportalawards.org/jsonapi/node/nominees?filter[field_categories.drupal_internal__tid]=${element.id}&filter[field_ongoing][value]=1&page[limit]=5&include=field_site_image&fields[file--file]=uri`);
      }
    })

    if (!categories.some(e => e.isChecked === true)) {
      this.getUrls('https://devportalawards.org/jsonapi/node/nominees?filter[field_ongoing][value]=1&page[limit]=5&include=field_site_image&fields[file--file]=uri');
    }
  }

  handlePaginaTion = (e) => {
    let id = e.currentTarget.id;
    const urls = [...this.state.urls];
    let url;

    urls.map(element => {
      if (id === element.id) {
        url = element.url;
        element.active = true;
      } else {
        element.active = false
      }
    })

    this.setState({urls: urls})

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
        let cards = [...this.state.cards];

        data[0]['data'].map((element, index) => {
          Promise.all([
            fetch(`https://devportalawards.org/jsonapi/node/nominees?filter[field_categories.drupal_internal__tid]=${element['attributes']['drupal_internal__tid']}`, {'method': 'GET'}),
          ])
            .then(values => Promise.all(values.map(value => value.json())))
            .then(data=> {
              this.setState({categories: [
                  ...this.state.categories,
                  ...[{
                    name: element['attributes']['name'],
                    isChecked: false,
                    id: element['attributes']['drupal_internal__tid'],
                    disabled: data[0]['data'].length < 1 ? true : false,
                  }]
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
        <ul>
          {this.state.urls.map((url, index)=>{
            return <li key={url.url}
                       id={url.id}
                       className={url.active ? 'active' : null}
                       onClick={(e)=>{this.handlePaginaTion(e)}}>{index + 1}
            </li>
          })}
        </ul>
      </div>
    )
  }
}

export default Main;
