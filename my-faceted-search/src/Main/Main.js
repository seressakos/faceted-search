import React, { Component } from 'react';

class Main extends Component {
  constructor() {
    super();
    this.state = {
      filters: [],
      cards: [],
      urls: [],
      hasData: true,
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
    this.setState({hasData: true});

    console.log(event)

    const filters = [...this.state.filters]
    filters.forEach(element => {
      element.node.map(e=>{
        if (e.name === event.target.value) {
          e.isChecked =  event.target.checked
        }
          
      return filters
      })
    })


    filters.map(filter => {
      filter.node.map(e => {
        if (e.isChecked === true) {
          this.getUrls(`https://devportalawards.org/jsonapi/node/nominees?filter[field_categories.drupal_internal__tid]=${e.id}&filter[field_ongoing][value]=1&page[limit]=5&include=field_site_image&fields[file--file]=uri`);
        }
      })
    })

    if (!filters.some(e => e.node.some(el=> el.isChecked=== true))) {
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
      fetch('https://devportalawards.org/jsonapi/taxonomy_term/category_group', {'method': 'GET'}),
    ])
      .then (values => Promise.all(values.map(value => value.json())))
      .then(data => {
        let categoryGroup = [];

        data[1]['data'].map(element => {
          categoryGroup = [
            ...categoryGroup, 
            ...[{
              title: element['attributes']['name'],
              relatedCategories: element['relationships']['field_category']['data'].map(el => {
                return el['id'];
              }),
              node: [],
          }]];
        });

        categoryGroup.map(el => {
          el.relatedCategories.map(e => {
            data[0]['data'].map((data, i)=> {
              if (e === data['id']) {
                 el.node.push({
                   name: data['attributes']['name'],
                   isChecked: false,
                   id: data['attributes']['drupal_internal__tid'],
                   status: 'enabled',
                 })
              }
            })
          })

          el.node.map(filter=> {
            Promise.all([
              fetch(`https://devportalawards.org/jsonapi/node/nominees?filter[field_categories.drupal_internal__tid]=${filter.id}&filter[field_ongoing][value]=1&page[limit]=1`, {'method': 'GET'}),
            ])
            .then (values => Promise.all(values.map(value => value.json())))
            .then(data => {
              if (data[0]['data'].length < 1) {
                filter.status = 'disabled';
              }
              
              this.setState({filters:categoryGroup})
            })
          })
        })   
      })
  };

  render() {
    return (
      <div>
        <div className='filters'>
          {this.state.filters.map(e=> {
            return <div key={e.title}>
              <h3>{e.title}</h3>
              {e.node.map(el => {
                return <div key={el.id}>
                  <input id={el.id} type="checkbox" value={el.name} status={el.status} onChange={this.handleCheckChieldElement}/>
                  <label>{el.name}</label>
                  </div>
              })}
            </div>
            })}
        </div>
        {this.state.hasData ? 
        this.state.cards.map(card=> {
          return <div key={card.title}>
            <h2>{card.title}</h2>
            <img src={card.imageurl}/>
          </div>
        }) : <div>Lofasztsetalaltal</div>}
  
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
