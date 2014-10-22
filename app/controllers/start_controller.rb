class StartController < ApplicationController
  def index
    @bodyClass = 'map'
  end

  def new
    @bodyClass = 'feature-list'
  end
end
