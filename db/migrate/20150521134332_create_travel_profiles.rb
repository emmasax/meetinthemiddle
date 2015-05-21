class CreateTravelProfiles < ActiveRecord::Migration
  def change
    create_table :travel_profiles do |t|
      t.string :person_1_start
      t.string :person_2_start
      t.string :travel_mode

      t.timestamps
    end
  end
end
