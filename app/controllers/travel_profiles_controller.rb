class TravelProfilesController < ApplicationController

  def new
    @travel_profile = TravelProfile.new
    @bodyClass = 'map'
  end

  def create
    @travel_profile = TravelProfile.new(travel_profile_params)

    if @travel_profile.save
      redirect_to @travel_profile
    else
      render :new
    end

  end

  def show
    @travel_profile = TravelProfile.find(params[:id])
    @bodyClass = 'map'
  end

  private

    def travel_profile_params
      params.require(:travel_profile).permit(:person_1_start, :person_2_start, :travel_mode)
    end

end