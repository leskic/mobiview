# encoding: UTF-8

require "json"

module MobiViewExporter

  module MaterialsWriter

    extend self

    def write(pieces, folder)

      materials = {}

      pieces.each do |piece|

        material = piece[:material]

        next if material.nil?
        next if material.to_s.strip.empty?

        materials[material] ||= {

          id: material,

          piece_count: 0,

          pieces: []

        }

        materials[material][:piece_count] += 1

        materials[material][:pieces] << piece[:mv_uuid]

      end

      file = File.join(folder, "materials.json")

      File.open(file, "w:utf-8") do |f|

        f.write(

          JSON.pretty_generate(

            materials.values.sort_by { |m| m[:id].to_s }

          )

        )

      end

      file

    end

  end

end