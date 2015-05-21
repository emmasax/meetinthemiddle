Meetinthemiddle::Application.routes.draw do

  resources :travel_profiles

  root 'travel_profiles#new'

  get 'start/index'
  match 'new', to: 'start#new', via: 'get'



end
