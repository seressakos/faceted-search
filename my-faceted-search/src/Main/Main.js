import React, { Component } from 'react';

class Main extends Component {
  constructor() {
    super();
    this.state = {
      terms: [],
      filters: [{
        'title': 'All',
        'node': [{
          'id': 'firstfilter',
          'checked': false,
          'name': 'all',
          'status': 'enabled'
        }]
      }],
      cards: [],
      urls: [],
      searchtext: '',
      loading: true,
    }

    this.getUrls = this.getUrls.bind(this);
  }

  getCards = (array, index, element, terms) => {
    return  {
        imageurl: "https://devportalawards.org/" + array[0]['included'][index]['attributes']['uri']['url'],
        title: element['attributes']['title'].toString(),
        sitelink: element['attributes']['field_sitelink'][0]['uri'],
        category: element['relationships']['field_categories']['data'].map(e => {
          let name;
          terms.map(category => {
            if (e.id === category.id) {
            name = category.name;
            }
          })
  
          return name;
        }),
      }
    } 

  getUrls = (url, currentUrl = url) => {
    Promise.all([
      fetch(`${url}`, {'method': 'GET'}),
    ])
      .then(values => Promise.all(values.map(value => value.json())))
      .then(data=> {
        const terms = [...this.state.terms];

        if (url === currentUrl) {
          let cards = [...this.state.cards];

          data[0]['data'].map((element, index)=> {
            const arrayHasObject = cards.some(el => el.title === element['attributes']['title'].toString());

            if (!arrayHasObject ) {
              cards = [
                ...cards,
                ...[
                  this.getCards(data, index, element, terms)
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

        this.setState({loading: false});
      });
  }

  inputHandler = (event) => {
    this.setState({searchtext: event.target.value})
  }

  submitHandler = (event) => {
    event.preventDefault();
    const searchText = this.state.searchtext
    let cards = [];
    const terms = [...this.state.terms];

    if (searchText === '') {
      return
    }

    this.setState({urls:[]});

    Promise.all([
      fetch('https://devportalawards.org/jsonapi/node/nominees?filter[field_ongoing][value]=1&include=field_site_image&fields[file--file]=uri', {'method': 'GET'}),
    ])
      .then (values => Promise.all(values.map(value => value.json())))
      .then(data => {
        data[0]['data'].map((element, index) => {
          cards = [
            ...cards,
            ...[this.getCards(data, index, element, terms)]
          ]
        })

        cards = cards.filter(card => card.title.toLowerCase().includes(searchText.toLowerCase()))

        this.setState({cards: cards});
        this.setState({loading: false});
      })
  }

  handleCheckChieldElement = (event) => {
    this.setState({cards: []});
    this.setState({urls: []})
    const filters = [...this.state.filters];

    filters.map(filter => {
      filter.node.map(e => {
        if (event.target.id == e.id) {
          e.checked = true;
        } else {
          e.checked = false;
        }
      })
    })

    this.setState({filters:filters})

    if (event.target.id === 'firstfilter') {
      this.getUrls('https://devportalawards.org/jsonapi/node/nominees?filter[field_ongoing][value]=1&page[limit]=5&include=field_site_image&fields[file--file]=uri');
    }

    this.getUrls(`https://devportalawards.org/jsonapi/node/nominees?filter[field_categories.drupal_internal__tid]=${event.target.id}&filter[field_ongoing][value]=1&page[limit]=5&include=field_site_image&fields[file--file]=uri`);
  }

  accordionHandler = (event) => {
    const filters = this.state.filters;

    filters.map((filter, index) => {
      if (event.target.innerHTML === filter.title) {
        filter.opened = !filters[index].opened;
      }
    });

    this.setState({filters: filters})
  }

  handlePaginaTion = (e) => {
    let id = e.currentTarget.id;
    const urls = [...this.state.urls];
    let url;
    const terms = [...this.state.terms]

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
              return this.getCards(data, index, element, terms)
            })
          ]
        })
      })
  }

  componentDidMount() {
    const urls =['https://devportalawards.org/jsonapi/node/nominees?filter[field_ongoing][value]=1&page[limit]=5&include=field_site_image&fields[file--file]=uri'];
   
    Promise.all([
      fetch('https://devportalawards.org/jsonapi/taxonomy_term/category', {'method': 'GET'}),
      fetch('https://devportalawards.org/jsonapi/taxonomy_term/category_group', {'method': 'GET'}),
    ])
      .then (values => Promise.all(values.map(value => value.json())))
      .then(data => {
        let categoryGroup = [...this.state.filters];

        data[1]['data'].map(element => {
          categoryGroup = [
            ...categoryGroup, 
            ...[{
              title: element['attributes']['name'],
              relatedCategories: element['relationships']['field_category']['data'].map(el => {
                return el['id'];
              }),
              opened: false,
              node: [],
          }]];
        });

        this.setState({terms: 
          data[0]['data'].map((data, i)=> {
            return {
              name: data['attributes']['name'],
              id: data['id'],
            }    
          })
        })

        categoryGroup.map((el, index) => {
          if (index > 0) {
            el.relatedCategories.map(e => {
              data[0]['data'].map((data, i)=> {
                if (e === data['id']) {
                   el.node.push({
                     name: data['attributes']['name'],
                     id: data['attributes']['drupal_internal__tid'],
                     checked: false,
                   });
                };
              });
            });
          };
        });

        this.setState({filters:categoryGroup})
        this.getUrls(urls[0]);
      })
  };

  render() {
    return (
      <div>
        <form action="search">
            <input type="text" id="search" name="search" value={this.state.searchtext} onChange={(e)=>this.inputHandler(e)}/>
             <input type="submit" value="Submit" onClick={(e)=>this.submitHandler(e)}/>
         </form> 
        <div className='filters'>
          {this.state.filters.map((e, index)=> {
            return <div key={e.title}>
              <h3 onClick={(e)=>this.accordionHandler(e)} className={e.opened ? 'open' : 'close'}>{e.title}</h3>
              {e.node.map(el => {
                return <div key={el.id}>
                  <input id={el.id} type="radio" value={el.name} checked={el.checked} name={el.name} onChange={this.handleCheckChieldElement}/>
                  <label>{el.name}</label>
                  </div>
              })}
            </div>
            })}
        </div>
        {this.state.loading ? <div>Loading</div> :
        <div>
           {this.state.cards.length > 0 ? 
           
            this.state.cards.map(card=> {
               return <div key={card.title}>
                        <h2>{card.title}</h2>
                        <img src={card.imageurl}/>
                        <div>
                             {card.category.map(taxname => {
                               return <p key={taxname}>{taxname}</p>
                             })}
                           </div>
                         </div>
           }) : 
           <h1>Lofasztsetalaltal</h1>}
          <ul>
          {this.state.urls.map((url, index) => {
            return <li key={url.url}
                       id={url.id}
                       className={url.active ? 'active' : null}
                       onClick={(e)=>{this.handlePaginaTion(e)}}>{index + 1}
            </li>
          })}
        </ul>
        </div>}
      </div>
    )
  }
}

export default Main;
